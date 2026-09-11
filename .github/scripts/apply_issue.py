#!/usr/bin/env python3
"""
ASTD Wiki — Automatisation d'intégration des issues GitHub
==========================================================
Ce script est exécuté par GitHub Actions lorsqu'une issue de contribution
est validée (par ajout de label 'validé'/'approved', commentaire '/valider',
ou clôture).

Il extrait le payload JSON embarqué dans l'issue, valide les données,
met à jour data/units.json (ou data/codes.json) et valide les modifications.
"""

import os
import sys
import re
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Labels reconnus pour valider automatiquement une issue
VALIDATION_LABELS = {'validé', 'valide', 'approved', 'accepté', 'accepte', 'merge'}

# Commandes acceptées en commentaire
VALIDATION_COMMANDS = {'/valider', '/valide', '/approve', '/accept', '/accepter'}


def log(msg):
    print(f"[apply_issue] {msg}")


def github_api_request(url, method='GET', data=None, token=None):
    """Envoie une requête à l'API REST de GitHub."""
    if not token:
        token = os.environ.get('GITHUB_TOKEN')
    headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ASTD-Wiki-Issue-Bot'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if data is not None:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(data).encode('utf-8')
    else:
        body = None

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        log(f"Erreur API GitHub {e.code} sur {url} : {err_body}")
        raise


def get_issue_data(repo, issue_number, token):
    """Récupère les informations détaillées d'une issue via l'API GitHub."""
    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
    return github_api_request(url, token=token)


def post_comment(repo, issue_number, comment_body, token):
    """Poste un commentaire sur l'issue."""
    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}/comments"
    try:
        github_api_request(url, method='POST', data={'body': comment_body}, token=token)
        log(f"Commentaire posté sur l'issue #{issue_number}")
    except Exception as e:
        log(f"Impossible de poster le commentaire : {e}")


def add_labels(repo, issue_number, labels, token):
    """Ajoute des labels à l'issue."""
    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}/labels"
    try:
        github_api_request(url, method='POST', data={'labels': labels}, token=token)
        log(f"Labels {labels} ajoutés à l'issue #{issue_number}")
    except Exception as e:
        log(f"Impossible d'ajouter les labels : {e}")


def close_issue(repo, issue_number, token):
    """Ferme l'issue en tant que 'completed'."""
    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
    try:
        github_api_request(url, method='PATCH', data={'state': 'closed', 'state_reason': 'completed'}, token=token)
        log(f"Issue #{issue_number} fermée avec succès.")
    except Exception as e:
        log(f"Impossible de fermer l'issue : {e}")


def extract_payload(issue_body):
    """Extrait le payload JSON du corps de l'issue."""
    if not issue_body:
        return None

    # Méthode 1 : Balises commentaires ASTD_PAYLOAD_START / ASTD_PAYLOAD_END
    match = re.search(r'<!--\s*ASTD_PAYLOAD_START\s*([\s\S]*?)\s*ASTD_PAYLOAD_END\s*-->', issue_body)
    if match:
        raw_json = match.group(1).strip()
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError as e:
            log(f"Erreur de décodage JSON dans ASTD_PAYLOAD : {e}")

    # Méthode 2 : Code block JSON explicite
    code_blocks = re.findall(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', issue_body)
    for block in code_blocks:
        try:
            data = json.loads(block.strip())
            if isinstance(data, dict) and ('type' in data or 'action' in data):
                return data
        except json.JSONDecodeError:
            continue

    return None


def sanitize_id(name):
    """Nettoie un nom pour en faire un identifiant unique valide."""
    clean = re.sub(r'[^a-zA-Z0-9_\s-]', '', name)
    clean = re.sub(r'[\s-]+', '_', clean.strip())
    return clean or f"unit_{int(datetime.now().timestamp())}"


def apply_unit_payload(unit_data):
    """Intègre ou met à jour une unité dans data/units.json."""
    units_file = os.path.join(DATA_DIR, 'units.json')
    if not os.path.exists(units_file):
        raise FileNotFoundError(f"Fichier de données introuvable : {units_file}")

    with open(units_file, 'r', encoding='utf-8') as f:
        units = json.load(f)

    unit_name = str(unit_data.get('name', '')).strip()
    if not unit_name:
        raise ValueError("Le nom de l'unité est requis.")

    unit_id = unit_data.get('id') or sanitize_id(unit_name)

    # Statistiques et paliers d'amélioration
    upgrades = unit_data.get('upgrades', [])
    if isinstance(upgrades, list) and upgrades:
        for idx, u in enumerate(upgrades):
            if not isinstance(u, dict):
                continue
            u['level'] = u.get('level', idx)
            u['cost'] = int(u.get('cost', 0))
            u['damage'] = float(u.get('damage', 0))
            u['range'] = float(u.get('range', 0))
            u['spa'] = float(u.get('spa', 1.0))
            spa = u['spa'] if u['spa'] > 0 else 1.0
            u['dps'] = round(u['damage'] / spa, 1)
            u['tower_type'] = str(u.get('tower_type', ''))
            u['attack_type'] = str(u.get('attack_type', ''))
            u['abilities'] = u.get('abilities', []) if isinstance(u.get('abilities'), list) else []

    # Calcul ou validation des totaux
    deploy_cost = int(unit_data.get('deployment_cost', 0))
    total_cost = int(unit_data.get('total_cost', 0))
    max_damage = float(unit_data.get('max_damage', 0))
    max_range = float(unit_data.get('max_range', 0))
    min_spa = float(unit_data.get('min_spa', 1.0))
    max_dps = float(unit_data.get('max_dps', 0))

    if upgrades:
        deploy_cost = int(upgrades[0].get('cost', deploy_cost))
        total_cost = sum(int(u.get('cost', 0)) for u in upgrades)
        max_damage = max((float(u.get('damage', 0)) for u in upgrades), default=max_damage)
        max_range = max((float(u.get('range', 0)) for u in upgrades), default=max_range)
        valid_spas = [float(u.get('spa', 0)) for u in upgrades if float(u.get('spa', 0)) > 0]
        min_spa = min(valid_spas) if valid_spas else min_spa
        dps_list = [round(float(u.get('damage', 0)) / (float(u.get('spa', 1)) or 1), 1) for u in upgrades]
        max_dps = max(dps_list) if dps_list else max_dps

    new_unit = {
        "id": unit_id,
        "name": unit_name,
        "star": int(unit_data.get('star', 5)),
        "image": unit_data.get('image') or "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png",
        "tower_type": str(unit_data.get('tower_type', 'Ground')),
        "attack_type": str(unit_data.get('attack_type', 'Single Target')),
        "deployment_cost": deploy_cost,
        "total_cost": total_cost,
        "max_damage": max_damage,
        "max_range": max_range,
        "min_spa": min_spa,
        "max_dps": round(max_dps, 1),
        "raw_damage": f"{deploy_cost} -> {max_damage:,.0f}".replace(',', ' '),
        "raw_range": f"{max_range}",
        "raw_spa": f"{min_spa}",
        "character_origin": unit_data.get('character_origin') or unit_name,
        "anime_origin": unit_data.get('anime_origin') or "ASTD Community",
        "obtain": unit_data.get('obtain') or "Proposition Communautaire validée",
        "overview": unit_data.get('overview') or f"{unit_name} est une unité {unit_data.get('star', 5)}★ ajoutée et validée par la communauté ASTD.",
        "is_tradeable": bool(unit_data.get('is_tradeable', False)),
        "is_unobtainable": bool(unit_data.get('is_unobtainable', False)),
        "evolution": unit_data.get('evolution', {"evolves_into": None, "materials": []}),
        "upgrades": upgrades,
        "_community_approved": True,
        "_approved_at": datetime.now(timezone.utc).isoformat()
    }

    # Recherche d'une unité existante avec cet ID ou nom
    existing_idx = next((i for i, u in enumerate(units) if u.get('id') == unit_id or u.get('name', '').lower() == unit_name.lower()), -1)
    is_update = existing_idx >= 0

    if is_update:
        # Fusionner en conservant les champs additionnels
        orig = units[existing_idx]
        if not unit_data.get('image') and orig.get('image'):
            new_unit['image'] = orig['image']
        if not unit_data.get('evolution') and orig.get('evolution'):
            new_unit['evolution'] = orig['evolution']
        units[existing_idx] = new_unit
        action_msg = f"Mise à jour de l'unité existante '{unit_name}' (ID: {unit_id})"
    else:
        # Insérer la nouvelle unité en début de liste
        units.insert(0, new_unit)
        action_msg = f"Ajout de la nouvelle unité '{unit_name}' (ID: {unit_id})"

    # Sauvegarde atomique de data/units.json
    temp_file = units_file + '.tmp'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(units, f, ensure_ascii=False, indent=2)
    os.replace(temp_file, units_file)

    log(f"data/units.json mis à jour : {action_msg}")

    # Nettoyage synchronisé de data/community_contributions.json
    comm_file = os.path.join(DATA_DIR, 'community_contributions.json')
    if os.path.exists(comm_file):
        try:
            with open(comm_file, 'r', encoding='utf-8') as f:
                comm_data = json.load(f)
            if 'units' in comm_data and unit_id in comm_data['units']:
                del comm_data['units'][unit_id]
            if 'deleted_units' in comm_data and unit_id in comm_data['deleted_units']:
                comm_data['deleted_units'].remove(unit_id)
            with open(comm_file, 'w', encoding='utf-8') as f:
                json.dump(comm_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            log(f"Note : Impossible de nettoyer community_contributions.json : {e}")

    update_meta()
    return new_unit, is_update


def apply_code_payload(code_data):
    """Intègre ou met à jour un code promo dans data/codes.json."""
    codes_file = os.path.join(DATA_DIR, 'codes.json')
    if not os.path.exists(codes_file):
        raise FileNotFoundError(f"Fichier introuvable : {codes_file}")

    with open(codes_file, 'r', encoding='utf-8') as f:
        codes = json.load(f)

    code_str = str(code_data.get('code', '')).strip()
    if not code_str:
        raise ValueError("Le code promotionnel est requis.")

    target_status = str(code_data.get('status', 'active')).lower()
    reward = str(code_data.get('reward', '')).strip() or "Récompense non précisée"
    today_str = datetime.now().strftime('%d.%m.%Y')

    code_obj = {
        "code": code_str,
        "reward": reward,
        "date": today_str,
        "status": target_status,
        "_community_approved": True
    }

    # Nettoyage des deux listes
    active_list = [c for c in codes.get('active', []) if c.get('code', '').lower() != code_str.lower()]
    expired_list = [c for c in codes.get('expired', []) if c.get('code', '').lower() != code_str.lower()]

    if target_status == 'expired':
        expired_list.insert(0, code_obj)
    else:
        active_list.insert(0, code_obj)

    codes['active'] = active_list
    codes['expired'] = expired_list

    temp_file = codes_file + '.tmp'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(codes, f, ensure_ascii=False, indent=2)
    os.replace(temp_file, codes_file)

    log(f"data/codes.json mis à jour pour le code : {code_str} ({target_status})")
    update_meta()
    return code_obj


def apply_orb_payload(orb_data):
    """Intègre ou met à jour un orbe dans data/orbs.json."""
    orbs_file = os.path.join(DATA_DIR, 'orbs.json')
    if not os.path.exists(orbs_file):
        raise FileNotFoundError(f"Fichier introuvable : {orbs_file}")

    with open(orbs_file, 'r', encoding='utf-8') as f:
        orbs = json.load(f)

    orb_name = str(orb_data.get('name', '')).strip()
    if not orb_name:
        raise ValueError("Le nom de l'orbe est requis.")

    orb_obj = {
        "name": orb_name,
        "image": orb_data.get('image') or "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png",
        "effect": orb_data.get('effect') or "Bonus spécial",
        "obtain": orb_data.get('obtain') or "Proposition Communautaire validée",
        "require": orb_data.get('require') or "All units",
        "_community_approved": True,
        "_approved_at": datetime.now(timezone.utc).isoformat()
    }

    orig_name = str(orb_data.get('_original_name') or orb_name).strip()
    existing_idx = next((i for i, o in enumerate(orbs) if o.get('name', '').lower() == orig_name.lower() or o.get('name', '').lower() == orb_name.lower()), -1)
    is_update = existing_idx >= 0

    if is_update:
        orig = orbs[existing_idx]
        if not orb_data.get('image') and orig.get('image'):
            orb_obj['image'] = orig['image']
        orbs[existing_idx] = orb_obj
        action_msg = f"Mise à jour de l'orbe existant '{orb_name}'"
    else:
        orbs.insert(0, orb_obj)
        action_msg = f"Ajout du nouvel orbe '{orb_name}'"

    temp_file = orbs_file + '.tmp'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(orbs, f, ensure_ascii=False, indent=2)
    os.replace(temp_file, orbs_file)

    log(f"data/orbs.json mis à jour : {action_msg}")

    # Nettoyage synchronisé de data/community_contributions.json
    comm_file = os.path.join(DATA_DIR, 'community_contributions.json')
    if os.path.exists(comm_file):
        try:
            with open(comm_file, 'r', encoding='utf-8') as f:
                comm_data = json.load(f)
            if 'orbs' in comm_data and orb_name in comm_data['orbs']:
                del comm_data['orbs'][orb_name]
            if 'deleted_orbs' in comm_data and orb_name in comm_data['deleted_orbs']:
                comm_data['deleted_orbs'].remove(orb_name)
            with open(comm_file, 'w', encoding='utf-8') as f:
                json.dump(comm_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            log(f"Note : Impossible de nettoyer community_contributions.json : {e}")

    update_meta()
    return orb_obj, is_update


def update_meta():
    """Met à jour l'horodatage dans data/meta.json."""
    meta_file = os.path.join(DATA_DIR, 'meta.json')
    meta = {}
    if os.path.exists(meta_file):
        try:
            with open(meta_file, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        except Exception:
            meta = {}
    meta['last_updated'] = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def main():
    token = os.environ.get('GITHUB_TOKEN')
    repo = os.environ.get('GITHUB_REPOSITORY', 'DZTic/astd-wiki')
    event_path = os.environ.get('EVENT_PATH') or os.environ.get('GITHUB_EVENT_PATH')
    event_name = os.environ.get('EVENT_NAME') or os.environ.get('GITHUB_EVENT_NAME', '')
    input_issue = os.environ.get('INPUT_ISSUE')

    log(f"Démarrage apply_issue. Repo: {repo}, Événement: {event_name}")

    event_data = {}
    if event_path and os.path.exists(event_path):
        with open(event_path, 'r', encoding='utf-8') as f:
            event_data = json.load(f)

    # Déterminer l'issue cible et vérifier la validité du déclencheur
    issue = None
    should_process = False
    validation_source = ""

    if input_issue:
        # Déclenchement manuel via workflow_dispatch
        issue_number = int(input_issue)
        should_process = True
        validation_source = f"Déclenchement manuel pour l'issue #{issue_number}"
        if token:
            issue = get_issue_data(repo, issue_number, token)
    elif event_name == 'issues':
        action = event_data.get('action')
        issue = event_data.get('issue', {})
        label = event_data.get('label', {})
        label_name = str(label.get('name', '')).lower()

        if action == 'labeled' and (label_name in VALIDATION_LABELS or 'valid' in label_name):
            should_process = True
            validation_source = f"Ajout du label '{label_name}'"
        elif action == 'closed':
            # Si fermée comme completed avec payload valide
            if issue.get('state_reason') == 'completed' or not issue.get('state_reason'):
                should_process = True
                validation_source = "Fermeture de l'issue (Close as completed)"

    elif event_name == 'issue_comment':
        action = event_data.get('action')
        comment = event_data.get('comment', {})
        issue = event_data.get('issue', {})
        author_assoc = comment.get('author_association', '')
        body_trimmed = comment.get('body', '').strip().lower()

        # Sécurité : Seuls les membres, collaborateurs ou propriétaires peuvent valider par commande
        is_authorized = author_assoc in {'OWNER', 'COLLABORATOR', 'MEMBER'}
        is_val_cmd = any(body_trimmed.startswith(cmd) for cmd in VALIDATION_COMMANDS)

        if action == 'created' and is_val_cmd:
            if is_authorized:
                should_process = True
                validation_source = f"Commande '{body_trimmed}' par {comment.get('user', {}).get('login')} ({author_assoc})"
            else:
                log(f"Commande de validation rejetée : l'utilisateur {comment.get('user', {}).get('login')} n'a pas les droits ({author_assoc}).")
                if token:
                    post_comment(repo, issue.get('number'),
                                 "⚠️ Seuls les mainteneurs et collaborateurs du dépôt peuvent valider cette proposition.",
                                 token)
                return 0

    if not should_process or not issue:
        log("Aucune condition de validation remplie. Arrêt normal.")
        return 0

    issue_number = issue.get('number')
    issue_body = issue.get('body', '')

    log(f"Traitement de l'issue #{issue_number} ({validation_source})")

    # Extraction du payload
    payload = extract_payload(issue_body)
    if not payload:
        log(f"Aucun payload ASTD JSON trouvé dans l'issue #{issue_number}.")
        return 0

    item_type = payload.get('type')
    item_data = payload.get('data', {})

    if item_type == 'unit':
        unit, is_update = apply_unit_payload(item_data)
        u_name = unit.get('name')
        u_star = unit.get('star')
        verb = "mise à jour" if is_update else "ajoutée"

        feedback_msg = (
            f"🎉 **Proposition validée !**\n\n"
            f"L'unité **{u_name}** ({u_star}★) a été automatiquement {verb} à la base de données officielle du Wiki ASTD (`data/units.json`).\n\n"
            f"- **Dégâts Max :** {unit.get('max_damage', 0):,.0f}\n"
            f"- **DPS Max :** {unit.get('max_dps', 0):,.0f}\n"
            f"- **Paliers d'amélioration :** {len(unit.get('upgrades', []))} paliers\n\n"
            f"🚀 *Le site GitHub Pages est en cours de redéploiement automatique (~1 minute).* Merci pour votre contribution !"
        )

    elif item_type == 'code':
        code = apply_code_payload(item_data)
        feedback_msg = (
            f"🎉 **Code Promo validé !**\n\n"
            f"Le code `{code.get('code')}` a été automatiquement intégré à la liste officielle des codes ASTD (`data/codes.json`).\n\n"
            f"🚀 *Le site GitHub Pages est en cours de redéploiement automatique (~1 minute).*"
        )

    elif item_type == 'orb':
        orb, is_update = apply_orb_payload(item_data)
        o_name = orb.get('name')
        verb = "mis à jour" if is_update else "ajouté"

        feedback_msg = (
            f"🎉 **Orbe validé !**\n\n"
            f"L'orbe **{o_name}** a été automatiquement {verb} au Compendium officiel des orbes ASTD (`data/orbs.json`).\n\n"
            f"- **Effet :** {orb.get('effect', '-')}\n"
            f"- **Compatibilité :** {orb.get('require', '-')}\n"
            f"- **Obtention :** {orb.get('obtain', '-')}\n\n"
            f"🚀 *Le site GitHub Pages est en cours de redéploiement automatique (~1 minute).* Merci pour votre contribution !"
        )

    else:
        log(f"Type d'élément inconnu dans le payload : {item_type}")
        return 0

    if token:
        post_comment(repo, issue_number, feedback_msg, token)
        add_labels(repo, issue_number, ['validé', 'intégré'], token)
        if issue.get('state') != 'closed':
            close_issue(repo, issue_number, token)

    log(f"Issue #{issue_number} traitée avec succès !")
    return 0


if __name__ == '__main__':
    sys.exit(main())
