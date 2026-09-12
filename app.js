// ==========================================
// ALL STAR TOWER DEFENSE - WIKI & DATABASE
// Tactical Pro Architecture (Mobalytics / OP.GG Style)
// ==========================================

var ALL_UNITS = [];
var FILTERED_UNITS = [];
var CODES_DATA = { active: [], expired: [] };
var ORBS_DATA = [];
var TIERLIST_DATA = {};
var GAMEMODES_DATA = [];
var META_DATA = {};
var MATERIAL_IMAGES = {};

window.ALL_UNITS = ALL_UNITS;
window.getGlobalUnits = () => ALL_UNITS;
window.setGlobalUnits = (list) => { ALL_UNITS = list; window.ALL_UNITS = list; };

window.ORBS_DATA = ORBS_DATA;
window.getGlobalOrbs = () => ORBS_DATA;
window.setGlobalOrbs = (list) => { ORBS_DATA = list; window.ORBS_DATA = list; };

let currentTab = 'units';
let currentStarFilter = 'all';
let currentViewMode = 'grid'; // 'grid' | 'table'
let currentTableSort = { field: 'star', direction: 'desc' };
let pageSize = 24;
let displayedCount = 24;
let currentModalUnit = null;
let teamSlots = [null, null, null, null, null, null];
let currentLevelView = 1; // 1 | 175 : niveau de carte affiché dans la fiche unité
let lastFocusedElement = null;

// ==========================================
// INTERNATIONALIZATION (I18N) - FR & EN
// ==========================================
let currentLang = localStorage.getItem('astd_lang') || 'fr';

const I18N = {
  fr: {
    // Header, brand & nav
    skip_to_content: "Aller au contenu principal",
    brand_subtitle: "Base de Données & Meta Hub",
    brand_aria: "Accueil ASTD Wiki",
    quick_search_placeholder: "Recherche rapide (Ctrl + K)...",
    quick_search_btn: "Rechercher...",
    quick_search_sr: "Recherche rapide d'unité ou anime",
    quick_search_aria: "Rechercher une unité",
    wiki_sync_label: "Synchro wiki :",
    units_label: "Unités",
    orbs_label: "Orbes",
    codes_autoupdate: "Actifs",
    latest_code_label: "Dernier code :",
    copy_btn: "Copier",
    copy_code_aria: "Copier le dernier code",
    lang_choice: "Langue",
    wiki_link_title: "Consulter le wiki Fandom officiel d'All Star Tower Defense",
    wiki_link_aria: "Ouvrir le wiki officiel Fandom dans un nouvel onglet",
    menu_toggle_aria: "Ouvrir le menu de navigation",
    nav_main_aria: "Navigation principale",
    nav_units: "Unités",
    nav_tierlist: "Tier List",
    nav_codes: "Codes",
    nav_orbs: "Orbes",
    nav_gamemodes: "Modes",
    nav_gamemodes_short: "Modes",
    nav_teambuilder: "Deck",
    nav_deck_short: "Deck",
    nav_compare: "Comparateur",
    nav_compare_short: "Versus",
    nav_community: "Communauté",
    nav_community_short: "Commu",
    nav_mobile_aria: "Menu mobile",
    mobile_search_placeholder: "Rechercher une unité...",
    drawer_units: "Tours & Unités",
    drawer_tierlist: "Tier List Officielle",
    drawer_codes: "Codes Actifs",
    drawer_orbs: "Compendium des Orbes",
    drawer_gamemodes: "Modes de Jeu & Raids",
    drawer_teambuilder: "Deck Builder (6 Slots)",
    drawer_compare: "Comparateur Tactique Pro",
    drawer_community: "Hub Communauté",
    btn_propose_unit: "Proposer une Unité",
    btn_propose_unit_short: "Ajouter",
    comm_btn_add_code_nav: "Proposer un Code",
    community_h1: "Espace et Contributions de la Communauté",
    modal_btn_edit: "Modifier",
    modal_btn_hide: "Masquer",
    modal_community_tips_title: "Conseils & Avis de la Communauté",
    btn_add_tip: "Partager un conseil",
    badge_community: "Communauté",
    badge_modified: "Modifié",
    btn_mark_expired: "Signaler expiré",
    btn_mark_expired_title: "Signaler ce code comme expiré",
    comm_upgrades_section_title: "Paliers d'Amélioration (Saisie Manuelle)",
    comm_upgrades_section_desc: "Renseignez à la main le coût, les dégâts, la portée et le SPA de chaque palier. Aucun multiplicateur automatique n'est imposé.",
    comm_btn_add_tier: "Ajouter un palier",
    comm_tier_deploy: "0 (Déploiement)",
    comm_del_tier: "Supprimer ce palier",
    comm_tier_required: "Veuillez renseigner au moins un palier d'amélioration.",
    comm_help_desc_upgrades: "Remplissez les informations générales et saisissez chaque palier d'amélioration manuellement. Le coût total et les statistiques maximales sont calculés directement à partir de vos paliers.",
    comm_field_image: "Image de l'Unité",
    comm_btn_browse_pc: "📁 Importer depuis mon PC",
    comm_or_enter_url: "ou saisissez un lien URL ci-dessous :",
    comm_img_from_pc_loaded: "Fichier PC importé",
    comm_img_remove: "Retirer cette image",
    comm_th_tower_type: "Type de Tour",
    comm_type_unchanged: "— Inchangé —",
    comm_type_ground: "🌱 Sol (Ground)",
    comm_type_hill: "🏔️ Colline (Hill)",
    comm_type_hybrid: "⚡ Hybride (Hybrid)",
    comm_type_air: "🦅 Aérien (Air)",
    comm_type_hybrid_badge: "Hybride",
    comm_type_hill_badge: "Colline",
    comm_type_air_badge: "Aérien",
    comm_type_ground_badge: "Sol",

    // Units Tab & Filters
    units_h1: "Base de Données des Tours & Unités ASTD",
    units_filter_aria: "Filtres de recherche des unités",
    filter_search_sr: "Rechercher une unité par nom",
    filter_search_aria: "Rechercher par nom d'unité ou franchise anime",
    filter_search_placeholder: "Nom ou franchise de l'unité...",
    clear_search_aria: "Effacer la recherche",
    filter_sort_sr: "Trier les unités",
    filter_sort_aria: "Critère de tri des unités",
    sort_recent_desc: "Plus Récentes d'abord",
    sort_star_desc: "Rareté (Décroissant)",
    sort_star_asc: "Rareté (Croissant)",
    sort_dps_desc: "DPS Max (Décroissant)",
    sort_dmg_desc: "Dégâts Max (Décroissant)",
    sort_cost_asc: "Coût Total (Plus bas)",
    sort_name_asc: "Nom (A → Z)",
    filter_tower_type_sr: "Filtrer par type de tour",
    filter_tower_type_aria: "Type de placement de la tour",
    filter_type_all: "Tous les types",
    filter_type_ground: "Sol (Ground)",
    filter_type_air: "Aérien (Air)",
    filter_type_hill: "Colline (Hill)",
    filter_type_hybrid: "Hybride (Sol & Air)",
    filter_anime_sr: "Filtrer par franchise",
    filter_anime_aria: "Franchise ou anime de provenance",
    filter_anime_all: "Toutes les franchises",
    filter_obtainable_title: "Masquer les unités bannies ou introuvables",
    filter_obtainable: "Obtenables uniquement",
    view_mode_aria: "Mode d'affichage de la liste",
    view_grid_title: "Affichage en cartes tactiques",
    view_grid_aria: "Afficher en grille de cartes tactiques",
    view_grid: "Grille",
    view_table_title: "Affichage en tableau détaillé",
    view_table_aria: "Afficher en tableau détaillé style Pro",
    view_table: "Tableau",
    filter_star_aria: "Filtrer par rareté d'étoiles",
    star_all: "Toutes",
    results_label: "Résultats :",
    units_grid_aria: "Grille des unités de défense",
    load_more_aria: "Charger les unités suivantes",
    load_more_units: "Charger plus d'unités",
    units_table_aria: "Tableau comparatif des unités de défense",
    th_unit: "Unité & Franchise",
    th_rarity: "Rareté",
    th_type: "Type",
    th_max_damage: "Dégâts Max",
    th_range: "Portée",
    th_spa: "SPA",
    th_max_dps: "DPS Max",
    th_total_cost: "Coût Max",
    th_action: "Actions",

    // Dynamic strings - Units List & Cards
    unit_singular: "unité",
    unit_plural: "unités",
    badge_new: "Nouveau",
    badge_unobtainable: "Introuvable",
    btn_card: "Fiche",
    btn_compare_title: "Comparer cette unité",
    btn_add_deck_title: "Ajouter au deck",
    no_matching_units: "Aucune unité ne correspond à vos filtres",
    no_results_for: "Aucun résultat pour « {searchVal} ».",
    no_results_combo: "Aucune unité disponible avec la combinaison de rareté et type sélectionnés.",
    reset_filters: "Réinitialiser les filtres",
    table_view_sheet: "Voir la fiche.",
    card_click_inspect: "Cliquer pour inspecter.",
    wiki_page_created_on: "Fiche wiki créée le",
    dmg_max_tooltip: "Dégâts au palier d'amélioration maximum",
    dps_max_tooltip: "Dégâts Par Seconde au palier maximum",
    range_max_tooltip: "Distance d'attaque maximale",
    spa_tooltip: "SPA : Secondes Par Attaque (délai entre deux attaques)",
    hud_range_short: "Portée",

    // Modal Unit Details
    modal_close_aria: "Fermer la fiche de l'unité",
    modal_card_level: "Niveau de carte :",
    modal_level_group_aria: "Niveau de carte pour les statistiques",
    modal_idol_toggle_title: "Simuler le buff de dégâts fourni par Idol (aptitude Shine)",
    buff_idol_label: "Buff Idol",
    hud_max_dmg: "Dégâts Max",
    hud_dmg_scale: "Échelle de dégâts du palier initial au palier max",
    hud_max_dps: "DPS Max Estimé",
    hud_tower_type: "Type de Placement",
    hud_attack_type: "Zone d'Attaque",
    hud_deploy_cost: "Déploiement",
    hud_total_cost: "Coût Total Max",
    modal_fandom_title: "Ouvrir la page Fandom officielle de cette unité",
    modal_fandom_aria: "Consulter la fiche officielle sur le wiki Fandom (nouvel onglet)",
    modal_btn_deck: "Ajouter au Deck",
    modal_btn_deck_aria: "Ajouter cette unité à votre équipe",
    modal_btn_compare: "Comparer",
    modal_btn_compare_title: "Comparer cette unité avec un autre personnage",
    modal_btn_compare_aria: "Ouvrir le comparateur avec cette unité",
    modal_obtain_title: "Source d'obtention",
    modal_evo_title: "Évolution de l'Unité",
    modal_preevo_title: "Pré-évolutions",
    btn_show: "Afficher",
    btn_hide: "Masquer",
    modal_abilities_title: "Capacités Spéciales, Passifs & Leader",
    modal_upgrades_title: "Progression des Améliorations (Paliers de Jeu)",
    th_level: "Palier",
    th_cost: "Coût",
    th_damage: "Dégâts",
    th_buff: "Buff",
    th_buff_title: "Buff de dégâts fourni aux unités alliées à portée (aptitude Shine)",
    th_effect: "Effets / Capacités",
    attack_type_tooltip: "AoE : Area of Effect (zone touchée par chaque attaque : cercle, cône, ligne...)",
    unknown: "Inconnu",
    anime_prefix: "Anime :",
    char_prefix: "Personnage :",
    origin_all_star: "Origine : Personnage All Star",
    added_on: "Ajoutée le",
    added_on_tooltip: "Fiche wiki créée le {date} — le badge Nouveau s'affiche pendant 30 jours",
    no_overview: "Aucune description détaillée enregistrée pour cette unité.",
    evolution_of: "Évolution de :",
    can_evolve_into: "Peut évoluer en",
    evolves_into: "Évolue en :",
    required_materials: "Matériaux requis :",
    units_evolving_into: "Unité{s} qui évolue{nt} en",
    ability_manual: "Aptitude Manuelle",
    ability_passive: "Passif Spécial",
    ability_leader: "Leader",
    ability_default: "Capacité",
    upgrade_effects_prefix: "Effets du palier",
    view_full_ability: "Voir la fiche complète de l'aptitude",
    upgrades_empty: "Statistiques de paliers détaillées non documentées pour cette unité.",
    tag_lvl175: "niveau de carte 175",
    tag_idol: "buff Idol +{pct}%",
    upg_buff_tooltip: "Buff de dégâts fourni aux unités à portée (aptitude Shine) — {lvl}",
    upg_buff_none: "Aucun buff à ce palier (Your Star remplace Shine)",
    click_read_ability: "Cliquer pour lire les effets et détails de capacité",
    lvl_175_card: "niveau de carte 175",
    lvl_1_card: "niveau de carte 1",

    // Tier List
    tierlist_heading: "Tier List Officielle ASTD",
    tierlist_subheading: "Classement officiel des meilleures unités par catégorie compétitive.",
    tierlist_region_aria: "Tier List Officielle ASTD",
    tierlist_loading: "Tier list en cours de chargement...",

    // Codes
    codes_heading: "Codes Cadeaux Actifs & Vérifiés",
    codes_subheading: "Tous les codes sont testés en jeu régulièrement. Cliquez sur Copier pour récupérer les récompenses.",
    codes_active_aria: "Codes cadeaux actifs",
    codes_expired_heading: "Codes Expirés / Inactifs",
    codes_filter_expired_sr: "Filtrer les codes expirés",
    codes_filter_expired_placeholder: "Rechercher un code expiré...",
    codes_filter_expired_aria: "Recherche dans l'historique des codes expirés",
    codes_expired_region_aria: "Liste des codes cadeaux expirés",
    code_verified_active: "Vérifié & Actif",
    code_recent: "Récent",
    code_rewards_label: "Récompenses :",
    btn_copy_code: "Copier le code",
    copied: "Copié !",
    toast_code_copied: "Code \"{code}\" copié !",
    no_expired_codes: "Aucun code expiré ne correspond à cette recherche.",

    // Orbs
    orbs_heading: "Compendium des Orbes",
    orbs_subheading: "Bonus de statistiques et conditions d'équipement des orbes.",
    search_orbs_sr: "Rechercher un orbe",
    search_orbs_placeholder: "Filtrer un orbe (nom, effet, unité compatible)...",
    search_orbs_aria: "Filtrer les orbes par nom, effet ou unité requise",
    orbs_grid_aria: "Compendium des orbes",
    all_units_badge: "★ Toutes les unités",
    universal_orb_title: "Équipable par toutes les unités",
    restricted_orb_title: "Réservé à cette unité (ou sa famille)",
    stat_bonus_label: "Bonus statistique :",
    special_bonus: "Bonus spécial",
    obtain_label: "Obtention :",
    compatible_label: "Compatible :",
    no_orbs_found: "Aucun orbe trouvé",
    no_orbs_query: "Aucun orbe ne correspond à la recherche « {q} ».",
    clear_search: "Effacer la recherche",
    comm_stat_orbs: "Orbes",
    add_orb_btn: "Ajouter un Orbe",
    comm_badge_orb: "Communauté",
    comm_btn_edit_orb_title: "Modifier cet orbe",
    comm_orb_new_badge: "Création locale",
    comm_orb_mod_badge: "Modifié localement",
    comm_title_add_orb: "Créer & Proposer un Nouvel Orbe",
    comm_title_edit_orb: "Modifier l'Orbe : {name}",
    comm_title_select_orb: "Modifier un orbe existant",
    comm_select_orb_to_edit: "Choisissez un orbe à modifier :",
    comm_btn_edit_orb_now: "Modifier cet orbe",
    comm_btn_save_orb_local: "Enregistrer Localement",
    comm_btn_propose_orb_github: "Enregistrer & Proposer au Wiki Officiel",
    comm_field_orb_name: "Nom de l'orbe *",
    comm_field_orb_effect: "Effet / Bonus Statistique *",
    comm_field_orb_require: "Compatibilité (Condition requise) *",
    comm_field_orb_obtain: "Méthode d'Obtention",
    comm_field_orb_image: "Illustration de l'Orbe (Fichier local ou URL)",
    comm_preview_live_title: "Aperçu en Direct",
    comm_preview_badge: "Aperçu Direct",
    comm_orb_saved: "Orbe « {name} » enregistré avec succès !",
    comm_orb_removed: "Orbe « {name} » retiré.",
    comm_orb_restored: "Orbe « {name} » restauré !",
    comm_confirm_delete_orb: "Voulez-vous vraiment retirer l'orbe « {name} » ? (Vous pourrez le restaurer à tout moment).",

    // Gamemodes
    gamemodes_heading: "Modes de Jeu & Raids",
    gamemodes_subheading: "Guides stratégiques et récompenses des différents modes de jeu.",
    gamemodes_grid_aria: "Modes de jeu et raids",
    mode_rewards_label: "Récompenses :",

    // Team Builder
    teambuilder_heading: "Tactical Team Builder (Deck 6 Slots)",
    teambuilder_subheading: "Analysez la couverture, le coût et la synergie de votre composition.",
    clear_team_btn: "Vider le deck",
    clear_team_aria: "Retirer toutes les unités du deck",
    team_slots_aria: "Slots du deck de l'équipe",
    team_stat_deploy_label: "Coût Déploiement Total",
    team_stat_total_label: "Coût Améliorations Max",
    team_stat_dps_label: "DPS Cumulé Estimé",
    team_coverage_title: "Couverture Stratégique",
    team_economy_title: "Économie & Contrôle",
    team_picker_title: "Ajouter une Unité au Deck",
    team_picker_sr: "Rechercher une tour à ajouter au deck",
    team_picker_placeholder: "Rechercher parmi les unités 6★ et 7★...",
    team_picker_aria: "Champ de recherche pour ajouter une unité au deck",
    team_picker_grid_aria: "Sélection des unités disponibles pour le deck",
    slot_empty_sr: "Slot {n} vide. Cliquer pour rechercher une tour.",
    slot_label: "SLOT {n}",
    add_a_tower: "Ajouter une tour",
    remove_from_deck: "Retirer {name} du deck",
    dep_short: "Dép",
    team_anti_ground: "Anti-Sol (Ground)",
    team_anti_air: "Anti-Aérien (Air)",
    team_economy: "Économie / Farm",
    team_support: "Support / Contrôle",
    btn_add: "+ Ajouter",
    toast_team_full: "Votre deck de 6 unités est plein !",
    toast_already_in_team: "{name} est déjà dans le deck !",
    toast_added_to_team: "{name} ajouté au slot {slot}",
    toast_removed_from_team: "{name} retiré du deck",
    toast_team_cleared: "Le deck a été vidé",

    // Comparator
    compare_heading: "Comparateur Tactique Pro (Versus)",
    compare_subheading: "Confrontez deux unités face-à-face : DPS, rentabilité ($/DPS), portée, cadence et verdict automatisé.",
    compare_level_group_aria: "Niveau de carte pour la comparaison",
    compare_idol_buff_title: "Simuler le buff maximal de dégâts fourni par Idol (+250%)",
    compare_slot_a_title: "Unité A :",
    compare_slot_a_sr: "Rechercher l'unité A",
    compare_slot_a_placeholder: "Rechercher l'unité A (ex. Demon of Emotion, Kura...)",
    compare_remove_btn: "Effacer",
    compare_swap_aria: "Intervertir unité A et unité B",
    compare_swap_title: "Intervertir unité A et unité B",
    compare_reset_aria: "Réinitialiser les deux unités sélectionnées",
    compare_reset_title: "Réinitialiser la comparaison",
    compare_slot_b_title: "Unité B :",
    compare_slot_b_sr: "Rechercher l'unité B",
    compare_slot_b_placeholder: "Rechercher l'unité B (ex. Stampede, Joke Da Fool...)",
    compare_popular_label: "Duels populaires :",
    compare_empty_title: "Sélectionnez 2 personnages pour comparer",
    compare_empty_desc: "Utilisez les champs de recherche ci-dessus pour désigner les deux unités à confronter, ou lancez un duel populaire en un clic.",
    compare_choose_second: "— choisissez la 2nde unité",
    compare_no_unit: "Aucune unité sélectionnée pour le moment.",
    loading_units: "Chargement des unités en cours...",
    no_units_found: "Aucune unité trouvée",
    toast_added_to_compare: "« {name} » ajouté au comparateur",
    dps_max_a: "DPS Max (A)",
    dmg_max_a: "Dégâts Max (A)",
    dps_max_b: "DPS Max (B)",
    dmg_max_b: "Dégâts Max (B)",
    verdict_title: "Verdict & Synthèse Tactique",
    verdict_subtitle: "Analyse comparative automatisée",
    pillar_dps: "💥 DPS Brut",
    pillar_spa: "⚡ Cadence (SPA)",
    pillar_range: "🎯 Portée",
    pillar_cost: "💰 Rentabilité ($/DPS)",
    verdict_diff: "d'écart",
    verdict_faster: "plus rapide",
    verdict_radius: "de rayon",
    verdict_ratio: "meilleur ratio",
    tie: "Égalité",
    compare_table_title: "Tableau Comparatif des Statistiques (Palier Max)",
    compare_abilities_title: "Capacités Spéciales, Passifs & Leader",
    no_abilities_documented: "Aucune capacité spéciale documentée.",
    metric_dmg_max: "Dégâts Max",
    metric_dps_max: "DPS Max Estimé",
    metric_range: "Portée d'Attaque (Range)",
    metric_spa: "SPA (Cadence d'attaque)",
    metric_deploy_cost: "Coût de Déploiement",
    metric_total_cost: "Coût Total d'Amélioration",
    metric_cost_per_dps: "Coût par point de DPS ($/DPS)",
    metric_upgrades_count: "Paliers d'Amélioration",
    note_spa: "Plus bas = plus rapide",
    note_deploy: "Plus bas = plus facile à poser",
    note_total: "Plus bas = maxé plus tôt",
    note_efficiency: "Plus bas = plus rentable",
    note_upgrades: "Moins de paliers = maxé plus rapidement",
    tiers_word: "paliers",

    // Footer
    footer_desc: "Base de données non officielle et hub stratégique pour All Star Tower Defense sur Roblox.",
    footer_sync: "Synchro automatique avec le wiki Fandom officiel.",
    db_label: "Données :",
    footer_last_updated_tpl: "Dernière synchro wiki : {date} ({count} unités)",

    // Pop-up d'accueil et annonce de soutien publicitaire
    ads_notice_badge: "Information & Soutien",
    ads_notice_title: "Bienvenue sur ASTD Wiki !",
    ads_notice_lead: "Ce site est une base de données indépendante et gratuite conçue pour toute la communauté All Star Tower Defense.",
    ads_notice_desc: "Pour financer l'hébergement et me soutenir dans les mises à jour et le développement, quelques publicités discrètes sont présentes sur le site.",
    ads_notice_reassurance: "Rassurez-vous : ces annonces ne dérangent absolument pas l'utilisation du site ni l'accès à vos données (encyclopédie, filtres, comparateur, simulateur). Aucune pop-up intrusive ne viendra interrompre votre navigation.",
    ads_notice_point1_title: "Confort de navigation garanti",
    ads_notice_point1_desc: "Aucune gêne lors de vos recherches ou de votre navigation.",
    ads_notice_point2_title: "100% Gratuit & Libre",
    ads_notice_point2_desc: "Accès illimité à l'intégralité des fonctionnalités et guides.",
    ads_notice_point3_title: "Merci de votre soutien",
    ads_notice_point3_desc: "Chaque visite permet de pérenniser le projet et sa maintenance.",
    ads_notice_thanks: "Merci infiniment pour votre compréhension et bon jeu sur ASTD !",
    ads_notice_btn: "J'ai compris, accéder au site"
  },
  en: {
    // Header, brand & nav
    skip_to_content: "Skip to main content",
    brand_subtitle: "Database & Meta Hub",
    brand_aria: "ASTD Wiki Home",
    quick_search_placeholder: "Search unit (Ctrl+K)...",
    quick_search_btn: "Search...",
    quick_search_aria: "Search unit",
    quick_search_sr: "Search unit",
    wiki_sync_label: "Wiki sync:",
    units_label: "Units",
    orbs_label: "Orbs",
    codes_autoupdate: "Active",
    latest_code_label: "Latest code:",
    copy_btn: "Copy",
    copy_code_aria: "Copy latest code",
    lang_choice: "Language",
    wiki_link_title: "Visit official All Star Tower Defense Fandom wiki",
    wiki_link_aria: "Open official Fandom wiki in a new tab",
    menu_toggle_aria: "Open navigation menu",
    nav_main_aria: "Main navigation",
    nav_units: "Units",
    nav_tierlist: "Tier List",
    nav_codes: "Codes",
    nav_orbs: "Orbs",
    nav_gamemodes: "Modes",
    nav_gamemodes_short: "Modes",
    nav_teambuilder: "Deck",
    nav_deck_short: "Deck",
    nav_compare: "Compare",
    nav_compare_short: "Versus",
    nav_community: "Community",
    nav_community_short: "Commu",
    nav_mobile_aria: "Mobile menu",
    mobile_search_placeholder: "Search unit...",
    drawer_units: "Towers & Units",
    drawer_tierlist: "Official Tier List",
    drawer_codes: "Active Codes",
    drawer_orbs: "Orbs Compendium",
    drawer_gamemodes: "Game Modes & Raids",
    drawer_teambuilder: "Deck Builder (6 Slots)",
    drawer_compare: "Tactical Pro Comparator",
    drawer_community: "Community Hub",
    btn_propose_unit: "Propose Unit",
    btn_propose_unit_short: "Add",
    comm_btn_add_code_nav: "Propose Code",
    community_h1: "Community Space & Contributions",
    modal_btn_edit: "Edit",
    modal_btn_hide: "Hide",
    modal_community_tips_title: "Community Tips & Insights",
    btn_add_tip: "Share a tip",
    badge_community: "Community",
    badge_modified: "Modified",
    btn_mark_expired: "Report expired",
    btn_mark_expired_title: "Report this code as expired",
    comm_upgrades_section_title: "Upgrade Tiers (Manual Input)",
    comm_upgrades_section_desc: "Manually enter the cost, damage, range and SPA for each tier. No automatic multiplier is forced.",
    comm_btn_add_tier: "Add upgrade tier",
    comm_tier_deploy: "0 (Deployment)",
    comm_del_tier: "Delete this tier",
    comm_tier_required: "Please provide at least one upgrade tier.",
    comm_help_desc_upgrades: "Fill in the general information and manually enter each upgrade tier. Total cost and max stats are derived directly from your tiers.",
    comm_field_image: "Unit Image",
    comm_btn_browse_pc: "📁 Import from PC",
    comm_or_enter_url: "or enter a web image URL below:",
    comm_img_from_pc_loaded: "PC file imported",
    comm_img_remove: "Remove this image",
    comm_th_tower_type: "Tower Type",
    comm_type_unchanged: "— Unchanged —",
    comm_type_ground: "🌱 Ground",
    comm_type_hill: "🏔️ Hill",
    comm_type_hybrid: "⚡ Hybrid",
    comm_type_air: "🦅 Air",
    comm_type_hybrid_badge: "Hybrid",
    comm_type_hill_badge: "Hill",
    comm_type_air_badge: "Air",
    comm_type_ground_badge: "Ground",

    // Units Tab & Filters
    units_h1: "ASTD Towers & Units Database",
    units_filter_aria: "Unit search filters",
    filter_search_sr: "Search unit by name",
    filter_search_aria: "Search by unit name or anime franchise",
    filter_search_placeholder: "Unit name or franchise...",
    clear_search_aria: "Clear search",
    filter_sort_sr: "Sort units",
    filter_sort_aria: "Unit sorting criteria",
    sort_recent_desc: "Newest first",
    sort_star_desc: "Rarity (Descending)",
    sort_star_asc: "Rarity (Ascending)",
    sort_dps_desc: "Max DPS (Descending)",
    sort_dmg_desc: "Max Damage (Descending)",
    sort_cost_asc: "Total Cost (Lowest)",
    sort_name_asc: "Name (A → Z)",
    filter_tower_type_sr: "Filter by tower type",
    filter_tower_type_aria: "Tower placement type",
    filter_type_all: "All types",
    filter_type_ground: "Ground",
    filter_type_air: "Air",
    filter_type_hill: "Hill",
    filter_type_hybrid: "Hybrid (Ground & Air)",
    filter_anime_sr: "Filter by franchise",
    filter_anime_aria: "Franchise or anime origin",
    filter_anime_all: "All franchises",
    filter_obtainable_title: "Hide unobtainable or expired units",
    filter_obtainable: "Obtainable only",
    view_mode_aria: "List display mode",
    view_grid_title: "Tactical cards view",
    view_grid_aria: "Show tactical cards grid",
    view_grid: "Grid",
    view_table_title: "Detailed table view",
    view_table_aria: "Show Pro style detailed table",
    view_table: "Table",
    filter_star_aria: "Filter by star rarity",
    star_all: "All",
    results_label: "Results:",
    units_grid_aria: "Defense units grid",
    load_more_aria: "Load next units",
    load_more_units: "Load more units",
    units_table_aria: "Comparative defense units table",
    th_unit: "Unit & Franchise",
    th_rarity: "Rarity",
    th_type: "Type",
    th_max_damage: "Max Damage",
    th_range: "Range",
    th_spa: "SPA",
    th_max_dps: "Max DPS",
    th_total_cost: "Max Cost",
    th_action: "Actions",

    // Dynamic strings - Units List & Cards
    unit_singular: "unit",
    unit_plural: "units",
    badge_new: "New",
    badge_unobtainable: "Unobtainable",
    btn_card: "Details",
    btn_compare_title: "Compare this unit",
    btn_add_deck_title: "Add to deck",
    no_matching_units: "No units match your filters",
    no_results_for: "No results for \"{searchVal}\".",
    no_results_combo: "No units available with the selected rarity and type.",
    reset_filters: "Reset filters",
    table_view_sheet: "View unit details.",
    card_click_inspect: "Click to inspect.",
    wiki_page_created_on: "Wiki page created on",
    dmg_max_tooltip: "Damage at maximum upgrade tier",
    dps_max_tooltip: "Damage Per Second at maximum tier",
    range_max_tooltip: "Maximum attack range",
    spa_tooltip: "SPA: Seconds Per Attack (delay between attacks)",
    hud_range_short: "Range",

    // Modal Unit Details
    modal_close_aria: "Close unit sheet",
    modal_card_level: "Card level:",
    modal_level_group_aria: "Card level for statistics",
    modal_idol_toggle_title: "Simulate damage buff provided by Idol (Shine ability)",
    buff_idol_label: "Idol Buff",
    hud_max_dmg: "Max Damage",
    hud_dmg_scale: "Damage scale from initial to max tier",
    hud_max_dps: "Max Estimated DPS",
    hud_tower_type: "Placement Type",
    hud_attack_type: "Attack Area",
    hud_deploy_cost: "Deployment",
    hud_total_cost: "Total Max Cost",
    modal_fandom_title: "Open official Fandom page for this unit",
    modal_fandom_aria: "View official wiki page on Fandom (new tab)",
    modal_btn_deck: "Add to Deck",
    modal_btn_deck_aria: "Add this unit to your squad",
    modal_btn_compare: "Compare",
    modal_btn_compare_title: "Compare this unit with another character",
    modal_btn_compare_aria: "Open comparator with this unit",
    modal_obtain_title: "Obtainment Source",
    modal_evo_title: "Unit Evolution",
    modal_preevo_title: "Pre-evolutions",
    btn_show: "Show",
    btn_hide: "Hide",
    modal_abilities_title: "Special Abilities, Passives & Leader",
    modal_upgrades_title: "Upgrade Progression (In-Game Tiers)",
    th_level: "Tier",
    th_cost: "Cost",
    th_damage: "Damage",
    th_buff: "Buff",
    th_buff_title: "Damage buff provided to allied units in range (Shine ability)",
    th_effect: "Effects / Abilities",
    attack_type_tooltip: "AoE: Area of Effect (area damaged per attack: circle, cone, line...)",
    unknown: "Unknown",
    anime_prefix: "Anime:",
    char_prefix: "Character:",
    origin_all_star: "Origin: All Star Character",
    added_on: "Added on",
    added_on_tooltip: "Wiki page created on {date} — New badge displayed for 30 days",
    no_overview: "No detailed description recorded for this unit.",
    evolution_of: "Evolution of:",
    can_evolve_into: "Can evolve into",
    evolves_into: "Evolves into:",
    required_materials: "Required materials:",
    units_evolving_into: "Unit{s} evolving into",
    ability_manual: "Manual Ability",
    ability_passive: "Special Passive",
    ability_leader: "Leader",
    ability_default: "Ability",
    upgrade_effects_prefix: "Upgrade effects for tier",
    view_full_ability: "View full ability details",
    upgrades_empty: "Detailed upgrade stats not documented for this unit.",
    tag_lvl175: "card level 175",
    tag_idol: "Idol buff +{pct}%",
    upg_buff_tooltip: "Damage buff provided to units in range (Shine ability) — {lvl}",
    upg_buff_none: "No buff at this tier (Your Star replaces Shine)",
    click_read_ability: "Click to read effects and ability details",
    lvl_175_card: "card level 175",
    lvl_1_card: "card level 1",

    // Tier List
    tierlist_heading: "Official ASTD Tier List",
    tierlist_subheading: "Official ranking of top units by competitive category.",
    tierlist_region_aria: "Official ASTD Tier List",
    tierlist_loading: "Loading tier list...",

    // Codes
    codes_heading: "Active & Verified Gift Codes",
    codes_subheading: "All codes are regularly tested in-game. Click Copy to claim rewards.",
    codes_active_aria: "Active gift codes",
    codes_expired_heading: "Expired / Inactive Codes",
    codes_filter_expired_sr: "Filter expired codes",
    codes_filter_expired_placeholder: "Search expired code...",
    codes_filter_expired_aria: "Search expired codes history",
    codes_expired_region_aria: "Expired gift codes list",
    code_verified_active: "Verified & Active",
    code_recent: "Recent",
    code_rewards_label: "Rewards:",
    btn_copy_code: "Copy code",
    copied: "Copied!",
    toast_code_copied: "Code \"{code}\" copied!",
    no_expired_codes: "No expired codes match this search.",

    // Orbs
    orbs_heading: "Orbs Compendium",
    orbs_subheading: "Stat bonuses and equip requirements for orbs.",
    search_orbs_sr: "Search an orb",
    search_orbs_placeholder: "Filter an orb (name, effect, compatible unit)...",
    search_orbs_aria: "Filter orbs by name, effect or required unit",
    orbs_grid_aria: "Orbs compendium",
    all_units_badge: "★ All units",
    universal_orb_title: "Equippable by all units",
    restricted_orb_title: "Reserved for this unit (or its family)",
    stat_bonus_label: "Stat bonus:",
    special_bonus: "Special bonus",
    obtain_label: "Obtainment:",
    compatible_label: "Compatible:",
    no_orbs_found: "No orbs found",
    no_orbs_query: "No orbs match the search \"{q}\".",
    clear_search: "Clear search",
    comm_stat_orbs: "Orbs",
    add_orb_btn: "Add an Orb",
    comm_badge_orb: "Community",
    comm_btn_edit_orb_title: "Edit this orb",
    comm_orb_new_badge: "Local creation",
    comm_orb_mod_badge: "Locally modified",
    comm_title_add_orb: "Create & Propose a New Orb",
    comm_title_edit_orb: "Edit Orb: {name}",
    comm_title_select_orb: "Edit an Existing Orb",
    comm_select_orb_to_edit: "Select an orb to edit:",
    comm_btn_edit_orb_now: "Edit this orb",
    comm_btn_save_orb_local: "Save Locally",
    comm_btn_propose_orb_github: "Save & Propose to Official Wiki",
    comm_field_orb_name: "Orb Name *",
    comm_field_orb_effect: "Effect / Stat Bonus *",
    comm_field_orb_require: "Compatibility (Requirement) *",
    comm_field_orb_obtain: "Obtainment Method",
    comm_field_orb_image: "Orb Illustration (Local file or URL)",
    comm_preview_live_title: "Live Preview",
    comm_preview_badge: "Live Preview",
    comm_orb_saved: "Orb \"{name}\" saved successfully!",
    comm_orb_removed: "Orb \"{name}\" removed.",
    comm_orb_restored: "Orb \"{name}\" restored!",
    comm_confirm_delete_orb: "Are you sure you want to remove the orb \"{name}\"? (You can restore it anytime).",

    // Gamemodes
    gamemodes_heading: "Game Modes & Raids",
    gamemodes_subheading: "Strategic guides and rewards for different game modes.",
    gamemodes_grid_aria: "Game modes and raids",
    mode_rewards_label: "Rewards:",

    // Team Builder
    teambuilder_heading: "Tactical Team Builder (6-Slot Deck)",
    teambuilder_subheading: "Analyze coverage, cost and synergy of your squad.",
    clear_team_btn: "Clear deck",
    clear_team_aria: "Remove all units from deck",
    team_slots_aria: "Team deck slots",
    team_stat_deploy_label: "Total Deploy Cost",
    team_stat_total_label: "Max Upgrade Cost",
    team_stat_dps_label: "Total Estimated DPS",
    team_coverage_title: "Strategic Coverage",
    team_economy_title: "Economy & Control",
    team_picker_title: "Add a Unit to Deck",
    team_picker_sr: "Search a tower to add to deck",
    team_picker_placeholder: "Search among 6★ and 7★ units...",
    team_picker_aria: "Search field to add a unit to deck",
    team_picker_grid_aria: "Available units selection for deck",
    slot_empty_sr: "Slot {n} is empty. Click to search a tower.",
    slot_label: "SLOT {n}",
    add_a_tower: "Add a tower",
    remove_from_deck: "Remove {name} from deck",
    dep_short: "Dep",
    team_anti_ground: "Anti-Ground",
    team_anti_air: "Anti-Air",
    team_economy: "Economy / Farm",
    team_support: "Support / Control",
    btn_add: "+ Add",
    toast_team_full: "Your 6-unit deck is full!",
    toast_already_in_team: "{name} is already in the deck!",
    toast_added_to_team: "{name} added to slot {slot}",
    toast_removed_from_team: "{name} removed from deck",
    toast_team_cleared: "Deck has been cleared",

    // Comparator
    compare_heading: "Tactical Pro Comparator (Versus)",
    compare_subheading: "Compare two units face-to-face: DPS, cost efficiency ($/DPS), range, attack rate, and automated verdict.",
    compare_level_group_aria: "Card level for comparison",
    compare_idol_buff_title: "Simulate maximum damage buff provided by Idol (+250%)",
    compare_slot_a_title: "Unit A:",
    compare_slot_a_sr: "Search unit A",
    compare_slot_a_placeholder: "Search unit A (e.g. Demon of Emotion, Kura...)",
    compare_remove_btn: "Clear",
    compare_swap_aria: "Swap unit A and unit B",
    compare_swap_title: "Swap unit A and unit B",
    compare_reset_aria: "Reset both selected units",
    compare_reset_title: "Reset comparison",
    compare_slot_b_title: "Unit B:",
    compare_slot_b_sr: "Search unit B",
    compare_slot_b_placeholder: "Search unit B (e.g. Stampede, Joke Da Fool...)",
    compare_popular_label: "Popular duels:",
    compare_empty_title: "Select 2 characters to compare",
    compare_empty_desc: "Use the search inputs above to choose two units to compare, or start a popular duel in one click.",
    compare_choose_second: "— select the 2nd unit",
    compare_no_unit: "No unit selected yet.",
    loading_units: "Loading units...",
    no_units_found: "No units found",
    toast_added_to_compare: "\"{name}\" added to comparator",
    dps_max_a: "Max DPS (A)",
    dmg_max_a: "Max Damage (A)",
    dps_max_b: "Max DPS (B)",
    dmg_max_b: "Max Damage (B)",
    verdict_title: "Tactical Verdict & Summary",
    verdict_subtitle: "Automated comparative analysis",
    pillar_dps: "💥 Raw DPS",
    pillar_spa: "⚡ Attack Rate (SPA)",
    pillar_range: "🎯 Range",
    pillar_cost: "💰 Efficiency ($/DPS)",
    verdict_diff: "difference",
    verdict_faster: "faster",
    verdict_radius: "radius advantage",
    verdict_ratio: "better ratio",
    tie: "Tie",
    compare_table_title: "Comparative Stats Table (Max Tier)",
    compare_abilities_title: "Special Abilities, Passives & Leader",
    no_abilities_documented: "No special abilities documented.",
    metric_dmg_max: "Max Damage",
    metric_dps_max: "Estimated Max DPS",
    metric_range: "Attack Range",
    metric_spa: "SPA (Attack Rate)",
    metric_deploy_cost: "Deployment Cost",
    metric_total_cost: "Total Upgrade Cost",
    metric_cost_per_dps: "Cost per DPS point ($/DPS)",
    metric_upgrades_count: "Upgrade Tiers",
    note_spa: "Lower = faster",
    note_deploy: "Lower = easier to place",
    note_total: "Lower = maxed earlier",
    note_efficiency: "Lower = more cost effective",
    note_upgrades: "Fewer tiers = maxed faster",
    tiers_word: "tiers",

    // Footer
    footer_desc: "Unofficial database and tactical meta hub for All Star Tower Defense on Roblox.",
    footer_sync: "Automatic synchronization with the official Fandom wiki.",
    db_label: "Data:",
    footer_last_updated_tpl: "Last wiki sync: {date} ({count} units)",

    // Welcome & Ads Support Notice Modal
    ads_notice_badge: "Notice & Support",
    ads_notice_title: "Welcome to ASTD Wiki!",
    ads_notice_lead: "This site is a free, independent encyclopedia designed for the entire All Star Tower Defense community.",
    ads_notice_desc: "To help cover server hosting and support ongoing maintenance and development, a few discreet ads are present on the site.",
    ads_notice_reassurance: "Rest assured: these ads will never disturb your browsing comfort or the use of any tools (encyclopedia, filters, comparator, team builder). No intrusive pop-up will disrupt your visit.",
    ads_notice_point1_title: "Seamless experience guaranteed",
    ads_notice_point1_desc: "No disruption while searching or exploring the database.",
    ads_notice_point2_title: "100% Free & Open",
    ads_notice_point2_desc: "Unlimited access to all features, data, and guides.",
    ads_notice_point3_title: "Thank you for your support",
    ads_notice_point3_desc: "Every visit helps keep the project online and updated.",
    ads_notice_thanks: "Thank you so much for your understanding and enjoy ASTD!",
    ads_notice_btn: "Got it, continue to site"
  }
};

function t(key, fallback = '') {
  if (I18N[currentLang] && I18N[currentLang][key] !== undefined) {
    return I18N[currentLang][key];
  }
  if (I18N['en'] && I18N['en'][key] !== undefined) {
    return I18N[currentLang][key];
  }
  return fallback || key;
}

function setLanguage(lang) {
  currentLang = (lang === 'en') ? 'en' : 'fr';
  try {
    localStorage.setItem('astd_lang', currentLang);
  } catch (e) {}

  if (document.documentElement) {
    document.documentElement.lang = currentLang;
  }

  // Active state on language switcher buttons
  const btnFr = document.getElementById('lang-btn-fr');
  const btnEn = document.getElementById('lang-btn-en');
  const btnMobFr = document.getElementById('lang-btn-mob-fr');
  const btnMobEn = document.getElementById('lang-btn-mob-en');

  if (btnFr) {
    btnFr.classList.toggle('active', currentLang === 'fr');
    btnFr.setAttribute('aria-pressed', currentLang === 'fr' ? 'true' : 'false');
  }
  if (btnEn) {
    btnEn.classList.toggle('active', currentLang === 'en');
    btnEn.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
  }
  if (btnMobFr) {
    btnMobFr.classList.toggle('active', currentLang === 'fr');
    btnMobFr.setAttribute('aria-pressed', currentLang === 'fr' ? 'true' : 'false');
  }
  if (btnMobEn) {
    btnMobEn.classList.toggle('active', currentLang === 'en');
    btnMobEn.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
  }

  // Update all DOM elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.textContent = I18N[currentLang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.setAttribute('placeholder', I18N[currentLang][key]);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.setAttribute('title', I18N[currentLang][key]);
    }
  });

  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key && I18N[currentLang] && I18N[currentLang][key] !== undefined) {
      el.setAttribute('aria-label', I18N[currentLang][key]);
    }
  });

  // Dynamic meta / footer texts
  if (META_DATA && META_DATA.last_updated) {
    const footerUpdated = document.getElementById('footer-last-updated');
    if (footerUpdated) {
      const tpl = t('footer_last_updated_tpl', 'Dernière synchro wiki : {date} ({count} unités)');
      footerUpdated.textContent = tpl.replace('{date}', META_DATA.last_updated).replace('{count}', META_DATA.total_units || ALL_UNITS.length);
    }
  }

  // Star filter button tooltips
  document.querySelectorAll('.star-btn').forEach(btn => {
    const val = (btn.getAttribute('onclick') || '').match(/setStarFilter\((\d)\)/);
    if (!val) return;
    const star = parseInt(val[1]);
    const count = ALL_UNITS.filter(u => u.star === star).length;
    const unitLabel = currentLang === 'en' ? (count > 1 ? 'units' : 'unit') : (count > 1 ? 'unités' : 'unité');
    btn.title = `${count} ${unitLabel} ${star}★`;
  });

  // Refresh active views if data has already been loaded
  if (ALL_UNITS && ALL_UNITS.length > 0) {
    applyUnitFilters();
    renderTierList();
    renderCodes();
    renderOrbs();
    renderGameModes();
    renderTeamBuilder();
    if (currentTab === 'compare') {
      renderCompareView();
    }
    const modal = document.getElementById('unit-modal');
    const isModalOpen = modal && !modal.classList.contains('hidden');
    if (currentModalUnit && isModalOpen) {
      const savedLevel = currentLevelView;
      openUnitModal(currentModalUnit.id);
      if (savedLevel && savedLevel !== 1) {
        setLevelView(savedLevel);
      }
    }
  }
}

// Data translation helpers
function translateSingleTowerType(type) {
  if (!type) return currentLang === 'fr' ? 'Sol' : 'Ground';
  const t = type.trim().toLowerCase();
  if (t === 'hybrid' || t.includes('hybrid')) return currentLang === 'fr' ? 'Hybride' : 'Hybrid';
  if (t === 'hill' || t.includes('hill')) return currentLang === 'fr' ? 'Colline' : 'Hill';
  if (t === 'air' || t.includes('air')) return currentLang === 'fr' ? 'Aérien' : 'Air';
  return currentLang === 'fr' ? 'Sol' : 'Ground';
}

function translateTowerType(type) {
  if (!type) return currentLang === 'fr' ? 'Sol' : 'Ground';
  if (type.includes('->') || type.includes('→')) {
    const parts = type.split(/->|→/).map(p => p.trim()).filter(Boolean);
    return parts.map(translateSingleTowerType).join(' → ');
  }
  return translateSingleTowerType(type);
}

function towerTypeTooltip(type) {
  const raw = type || 'Ground';
  if (raw.includes('->') || raw.includes('→')) {
    const translated = translateTowerType(raw);
    return currentLang === 'fr' ?
      `Type évolutif : ${translated} (change de placement au fil des paliers d'amélioration)` :
      `Evolving type: ${translated} (changes placement/targeting through upgrade tiers)`;
  }
  const t = raw.toLowerCase();
  if (currentLang === 'fr') {
    if (t.includes('hybrid')) return "Hybride : peut attaquer les ennemis au sol ET aériens";
    if (t.includes('hill')) return "Colline (Hill) : se place sur les hauteurs, attaque sol et air";
    if (t.includes('air')) return "Aérien : n'attaque que les ennemis volants";
    return "Sol (Ground) : n'attaque que les ennemis au sol";
  } else {
    if (t.includes('hybrid')) return "Hybrid: can attack both Ground and Air enemies";
    if (t.includes('hill')) return "Hill: placed on high ground, attacks ground and air";
    if (t.includes('air')) return "Air: attacks flying enemies only";
    return "Ground: attacks ground enemies only";
  }
}

function translateAttackType(type) {
  if (!type) return 'AoE';
  if (currentLang === 'fr') {
    return type
      .replace(/Circle/gi, 'Cercle')
      .replace(/Cone/gi, 'Cône')
      .replace(/Full/gi, 'Complet')
      .replace(/Single Target/gi, 'Cible Unique')
      .replace(/Single/gi, 'Unique')
      .replace(/Line/gi, 'Ligne');
  } else {
    return type
      .replace(/Cercle/gi, 'Circle')
      .replace(/Cône/gi, 'Cone')
      .replace(/Complet/gi, 'Full')
      .replace(/Cible Unique/gi, 'Single Target')
      .replace(/Unique/gi, 'Single');
  }
}

function translateAbilityName(name) {
  if (!name) return '';
  if (currentLang === 'en') {
    return name
      .replace(/Compétence de Leader/gi, 'Leader Skill')
      .replace(/Chef d'équipe/gi, 'Team Leader');
  } else {
    return name
      .replace(/Leader Skill/gi, 'Compétence de Leader')
      .replace(/Team Leader/gi, "Chef d'équipe");
  }
}

function translateUnlock(unlock) {
  if (!unlock) return '';
  if (currentLang === 'fr') {
    return unlock
      .replace(/Available upon deployment/gi, 'Disponible dès le déploiement')
      .replace(/(\d+)(?:st|nd|rd|th) Upgrade/gi, '$1e Amélioration')
      .replace(/Upgrade (\d+)/gi, 'Palier $1');
  } else {
    return unlock
      .replace(/Disponible dès le déploiement/gi, 'Available upon deployment')
      .replace(/(\d+)e Amélioration/gi, '$1th Upgrade')
      .replace(/Palier (\d+)/gi, 'Upgrade $1');
  }
}

function translateObtain(text) {
  if (!text) return '';
  if (currentLang === 'fr') {
    return text
      .replace(/via\s+Evolution\s+or\s+Hero\s+Summon/gi, "via Évolution ou Invocation Héros")
      .replace(/via\s+Evolution\s+or\s+Special\s+Summon/gi, "via Évolution ou Invocation Spéciale")
      .replace(/via\s+Evolution\s+or\s+Banner\s+Z/gi, "via Évolution ou Bannière Z")
      .replace(/via\s+Evolution/gi, "via Évolution")
      .replace(/via\s+Hero\s+Summon/gi, "via Invocation Héros")
      .replace(/Evolution\s+or\s+/gi, "Évolution ou ")
      .replace(/\bor\b/gi, "ou")
      .replace(/Summon Banner/gi, "Bannière d'invocation")
      .replace(/Hero Summon/gi, "Invocation Héros")
      .replace(/Special Summon/gi, "Invocation Spéciale")
      .replace(/Banner\s+Z/gi, "Bannière Z")
      .replace(/Story Mode/gi, "Mode Histoire")
      .replace(/Infinite Mode/gi, "Mode Infini")
      .replace(/Trial/gi, "Épreuve")
      .replace(/Raid/gi, "Raid")
      .replace(/Traveling Merchant/gi, "Marchand ambulant")
      .replace(/Evolve from/gi, "Évolution de")
      .replace(/Evolves into/gi, "Évolue en")
      .replace(/Evolution/gi, "Évolution");
  } else {
    return text
      .replace(/via\s+Évolution\s+ou\s+Invocation\s+Héros/gi, "via Evolution or Hero Summon")
      .replace(/via\s+Évolution/gi, "via Evolution")
      .replace(/Bannière d'invocation/gi, "Summon Banner")
      .replace(/Invocation Héros/gi, "Hero Summon")
      .replace(/Invocation Spéciale/gi, "Special Summon")
      .replace(/Bannière\s+Z/gi, "Banner Z")
      .replace(/Mode Histoire/gi, "Story Mode")
      .replace(/Mode Infini/gi, "Infinite Mode")
      .replace(/Épreuve/gi, "Trial")
      .replace(/Marchand ambulant/gi, "Traveling Merchant")
      .replace(/Évolution de/gi, "Evolve from")
      .replace(/Évolue en/gi, "Evolves into")
      .replace(/Évolution/gi, "Evolution")
      .replace(/\bou\b/gi, "or");
  }
}

function translateOverview(text, unit) {
  if (!text || currentLang === 'en') return text;
  let fr = text;

  // 1. Définition canonique de l'unité
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+is\s+a\s+(\d+)[\-\s]star\s+(?:(ground|air|hill|hybrid)\s+)?unit\s+based\s+(?:on|off)\s+([^,\.]+?)\s+from\s+(?:the\s+)?([^,\.]+?)(?:\s+franchise|\s+series|\s+anime)?\./gi, (m, name, stars, type, char, fran) => {
    let tStr = '';
    if (type) {
      const tl = type.toLowerCase();
      tStr = tl === 'ground' ? ' (Sol)' : tl === 'air' ? ' (Aérien)' : tl === 'hill' ? ' (Colline)' : ' (Hybride)';
    }
    return `${name.trim()} est une unité ${stars} étoiles${tStr} basée sur ${char.trim()} de la franchise ${fran.trim()}.`;
  });

  // 2. Arc narratif / fin de série
  fr = fr.replace(/This variant takes the place at\s+(?:the\s+)?(.+?)\s+arc,\s+where is the End of Series\.?/gi, 'Cette variante prend place lors de l\'arc $1, marquant la fin de la série.');
  fr = fr.replace(/This variant takes the place at\s+(?:the\s+)?(.+?)\s+arc\.?/gi, 'Cette variante prend place lors de l\'arc $1.');
  fr = fr.replace(/during his fight with\s+([^,\.]+?)\.?/gi, 'pendant son combat contre $1.');
  fr = fr.replace(/in his\s+([^,\.]+?)\s+form from\s+([^,\.]+?)\.?/gi, 'sous sa forme $1 de $2.');

  // 3. Évolution
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+can\s+be\s+evolved\s+from\s+([^,\.]+?)\s+(?:by\s+using(?:\s+the\s+following\s+materials)?:?|using:?)\s*(.+)?$/gi, (m, name, from, mats) => {
    const matStr = mats ? ` via : ${mats.trim().replace(/Evolution/gi, 'Évolution')}` : '.';
    return `${name.trim()} peut être obtenue par évolution depuis ${from.trim()}${matStr}`;
  });
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+can\s+be\s+evolved\s+from\s+([^,\.]+?)\.?/gi, (m, name, from) => {
    return `${name.trim()} peut être obtenue par évolution depuis ${from.trim()}.`;
  });

  // 4. Shiny / Boss de Raid / Obtention
  fr = fr.replace(/(?:His|Her)\s+shiny\s+variant\s+is\s+based\s+on\s+([^,\.]+?)\s+from\s+the\s+same\s+franchise\.?/gi, 'Sa variante shiny est basée sur $1 de la même franchise.');
  fr = fr.replace(/(?:He|She)\s+is\s+also\s+the\s+boss\s+of\s+(?:his|her)\s+own\s+event\s+raid\.?/gi, 'Cette unité est également le boss de son propre raid d\'événement.');
  fr = fr.replace(/([A-Za-z0-9\s\(\)\'\.\-\:\?\%]+?)\s+can\s+be\s+obtained\s+from\s+(.+?)\.?$/gi, (m, name, src) => {
    return `${name.trim()} peut être obtenue via ${translateObtain(src.trim())}.`;
  });

  // 5. Nettoyage
  fr = fr.replace(/\bEvolution\b/g, 'Évolution');

  return fr;
}

function translateAbilityDescription(text) {
  if (!text || currentLang === 'en') return text;
  let fr = text;

  // 1. Leader Skills
  fr = fr.replace(/units in the\s+['"]?([^'"]+?)['"]?\s+category gain (?:an?|a)\s*(\d+)%\s*attack boost(\s*and boosts money by\s*(\d+)%)?\.?/gi, (m, cat, boost, mBoost, money) => {
    return `Les unités de la catégorie ${cat} bénéficient d'un bonus d'attaque de ${boost}%${money ? ` et augmentent l'argent de ${money}%` : ''}.`;
  });
  fr = fr.replace(/Units in the\s+['"]?([^'"]+?)['"]?\s+or\s+['"]?([^'"]+?)['"]?\s+Category gain (?:an?|a)\s*(\d+)%\s*attack boost\.?/gi, (m, cat1, cat2, boost) => {
    return `Les unités des catégories ${cat1} ou ${cat2} bénéficient d'un bonus d'attaque de ${boost}%.`;
  });
  fr = fr.replace(/Units in the\s+['"]?([^'"]+?)['"]?\s+Category gain Attack Boost \+(\d+)% and \+(\d+)% Bonus\.?/gi, (m, cat, b1, b2) => {
    return `Les unités de la catégorie ${cat} bénéficient d'un bonus d'attaque de +${b1}% et d'un bonus de +${b2}%.`;
  });
  fr = fr.replace(/units in the\s+['"]?([^'"]+?)['"]?\s+category gain (?:an?|a)\s*(\d+)%\s*damage buff/gi, 'les unités de la catégorie $1 bénéficient d\'un bonus de dégâts de $2%');

  // 2. TypeBane & Spécialités d'ennemis
  fr = fr.replace(/Her attack can cause (\d+x) Damage on all Special Enemies, especially she can damage on Elemental enemies\./gi, 'Son attaque inflige $1 dégâts à tous les ennemis spéciaux, et elle peut notamment toucher les ennemis élémentaires.');
  fr = fr.replace(/His attack can cause (\d+x) Damage on all Special Enemies, especially he can damage on Elemental enemies\./gi, 'Son attaque inflige $1 dégâts à tous les ennemis spéciaux, et il peut notamment toucher les ennemis élémentaires.');
  fr = fr.replace(/Their attack can cause (\d+x) Damage on all Special Enemies, especially they can damage on Elemental enemies\./gi, 'Leur attaque inflige $1 dégâts à tous les ennemis spéciaux, et ils peuvent notamment toucher les ennemis élémentaires.');
  fr = fr.replace(/attack can cause (\d+x) Damage on all Special Enemies/gi, 'l\'attaque inflige $1 dégâts à tous les ennemis spéciaux');
  fr = fr.replace(/especially (?:she|he|they) can damage on Elemental enemies/gi, 'notamment la capacité de toucher les ennemis élémentaires');
  fr = fr.replace(/can do (\d+x) damage to enemies that have or originally\s*•?\s*have a Title and can also do Piercing damage to Elemental enemies/gi, 'inflige $1 dégâts aux ennemis possédant ou ayant eu un Titre, et inflige des dégâts perforants aux ennemis élémentaires');
  fr = fr.replace(/can do (\d+x) damage to enemies with a Title and can also do Piercing damage to Elemental enemies/gi, 'inflige $1 dégâts aux ennemis possédant un Titre, et inflige des dégâts perforants aux ennemis élémentaires');
  fr = fr.replace(/can still do (\d+x) damage to enemies that got turned? into regular enemies/gi, 'inflige toujours $1 dégâts aux ennemis transformés en ennemis normaux');
  fr = fr.replace(/can still do (\d+x) damage to enemies that got turn to regular enemies/gi, 'inflige toujours $1 dégâts aux ennemis transformés en ennemis normaux');

  // 3. Formulations de frappe critique et récurrence
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack, (?:she|he|they|it) will deal ([\d\.]+)x of (?:her|his|their|its) current Damage\./gi, 'Toutes les $1 attaques, inflige $2x ses dégâts actuels.');
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack, (?:she|he|they|it) deals? ([\d\.]+)x damage\./gi, 'Toutes les $1 attaques, inflige $2x dégâts.');

  // 4. Déclencheurs & Activation
  fr = fr.replace(/(?:•\s*)?Upon activation of this ability,\s*/gi, 'À l\'activation de cette capacité, ');
  fr = fr.replace(/(?:•\s*)?Upon activation,\s*/gi, 'À l\'activation, ');
  fr = fr.replace(/(?:•\s*)?When activated,\s*/gi, 'À l\'activation, ');
  fr = fr.replace(/(?:•\s*)?After activation,\s*/gi, 'Après activation, ');
  fr = fr.replace(/(?:•\s*)?After activating this ability,\s*/gi, 'Après activation de cette capacité, ');
  fr = fr.replace(/(?:•\s*)?When Attacking,\s*/gi, 'En attaquant, ');

  // 5. Domaines et altérations massives
  fr = fr.replace(/will release a nuke of ([\d\.]+)\s*billion damage to all enemies on the map/gi, 'déclenche une explosion de $1 milliards de dégâts à tous les ennemis sur la carte');
  fr = fr.replace(/will deploy a Domain Effect within (\d+) seconds \((\d+) minutes\)/gi, 'déploie un effet de domaine pendant $1 secondes ($2 minutes)');
  fr = fr.replace(/In this active domain,\s*/gi, 'Dans ce domaine actif, ');
  fr = fr.replace(/all enemies will move (\d+)% slower/gi, 'tous les ennemis se déplacent $1% plus lentement');
  fr = fr.replace(/\(Stacking with Slow\s*\)/gi, '(Cumulable avec Ralentissement)');
  fr = fr.replace(/and they also constantly lose ([\d\.]+)% of their max HP until it reaches (\d+)% of their Max HP/gi, 'et ils perdent constamment $1% de leurs PV max jusqu\'à atteindre $2% de leurs PV max');
  fr = fr.replace(/Additionally, the ally units placed with the\s*([^.]+?)\s*categories will gain an extra (\d+)% damage boost and will deal Super Effective Damage against Enchant enemies/gi, 'De plus, les unités alliées placées avec les catégories $1 bénéficient d\'un bonus de dégâts supplémentaire de $2% et infligent des dégâts super efficaces contre les ennemis enchantés');

  // 6. Dégâts et multiplicateurs
  fr = fr.replace(/Deals\s*([\d\.]+)x\s*damage to enemies affected by\s*([^,\.]+?)(?:,\s*([^,\.]+?))?(?:,\s*or\s*([^,\.]+?))?\./gi, (m, mult, e1, e2, e3) => {
    const effs = [e1, e2, e3].filter(Boolean).map(e => e.trim().replace(/Bleed/gi, 'Saignement').replace(/Rupture/gi, 'Rupture').replace(/Judgement/gi, 'Jugement')).join(', ');
    return `Inflige ${mult}x dégâts aux ennemis affectés par ${effs}.`;
  });
  fr = fr.replace(/deals? (\d+(?:\.\d+)?)\s*billion damage/gi, 'inflige $1 milliards de dégâts');
  fr = fr.replace(/deals? (\d+(?:\.\d+)?)\s*million damage/gi, 'inflige $1 millions de dégâts');
  fr = fr.replace(/deal (\d+)x (?:his|her|their) damage/gi, 'infliger $1x ses dégâts');
  fr = fr.replace(/deal (\d+)x damage/gi, 'infliger $1x dégâts');
  fr = fr.replace(/deal Super Effective Damage/gi, 'infligent des dégâts super efficaces');
  fr = fr.replace(/damages the base when raging/gi, 'inflige des dégâts à la base en état d\'enragement');
  fr = fr.replace(/removes? (\d+)% of all enemies' current HP/gi, 'retire $1% des PV actuels de tous les ennemis');
  fr = fr.replace(/under (\d+)% of their maximum health/gi, 'ayant moins de $1% de leurs PV max');

  // 7. Base HP & Sacrifices
  fr = fr.replace(/half of your base's HP will be removed/gi, 'la moitié des PV de votre base est retirée');
  fr = fr.replace(/The removed HP is added to the base nuke of ([\d\.]+)\s*billion/gi, 'Les PV retirés sont ajoutés à l\'explosion de base de $1 milliards');
  fr = fr.replace(/The total damage caps at ([\d\.]+)\s*billion/gi, 'Les dégâts totaux sont plafonnés à $1 milliards');
  fr = fr.replace(/delete (?:himself|herself|itself) without a refund/gi, 's\'auto-détruit sans remboursement');
  fr = fr.replace(/(?:he|she|it) can be replaced afterwards/gi, 'peut être replacé(e) ensuite');

  // 8. Timestop & Stun
  fr = fr.replace(/deals ultimate timestop to all enemies for (\d+) seconds/gi, 'applique un arrêt du temps ultime à tous les ennemis pendant $1 secondes');
  fr = fr.replace(/inflicts them with a debuff that increases damage taken by (\d+)%/gi, 'leur applique un malus augmentant les dégâts subis de $1%');
  fr = fr.replace(/Within (\d+) seconds of activation, if the enemy hits the base, it will push all of them backward (\d+) paths\/corners/gi, 'Dans les $1 secondes suivant l\'activation, si un ennemi touche la base, il les repousse tous en arrière de $2 virages/chemins');
  fr = fr.replace(/It works similarly as and shares the global cooldown with\s*/gi, 'Fonctionne de manière similaire et partage le temps de recharge global avec ');

  // 9. Cooldowns & Règles d'usage
  fr = fr.replace(/(\d+)\s*minute\s*\((\d+)\s*second\)\s*global cooldown/gi, 'temps de recharge global de $1 min ($2 s)');
  fr = fr.replace(/(\d+)\s*second\s*global cooldown/gi, 'temps de recharge global de $1 secondes');
  fr = fr.replace(/global cooldown of (\d+) minutes/gi, 'temps de recharge global de $1 minutes');
  fr = fr.replace(/cooldown of (\d+) seconds \((\d+) minutes and (\d+) seconds\)/gi, 'temps de recharge de $1 secondes ($2 min $3 s)');
  fr = fr.replace(/cooldown of (\d+) minutes (\d+) seconds \((\d+) seconds\)/gi, 'temps de recharge de $1 min $2 s ($3 secondes)');
  fr = fr.replace(/has an infinite global cooldown, meaning it can only be used once per game/gi, 'possède un temps de recharge global infini (utilisation unique par partie)');
  fr = fr.replace(/This ability has an infinite global cooldown that shared with\s*/gi, 'Cette capacité possède un temps de recharge global infini partagé avec ');
  fr = fr.replace(/This ability has a PERMANENT GLOBAL cooldown/gi, 'Cette capacité possède un temps de recharge GLOBAL PERMANENT');
  fr = fr.replace(/This ability has a global cooldown/gi, 'Cette capacité possède un temps de recharge global');
  fr = fr.replace(/shares global cooldown with\s*/gi, 'partage le temps de recharge global avec ');
  fr = fr.replace(/shares a GLOBAL cooldown with\s*/gi, 'partage le temps de recharge global avec ');
  fr = fr.replace(/shares a Global Cooldown with\s*/gi, 'partage le temps de recharge global avec ');
  fr = fr.replace(/One-time use per game/gi, 'Utilisation unique par partie');
  fr = fr.replace(/can only be used once per game/gi, 'ne peut être utilisée qu\'une seule fois par partie');
  fr = fr.replace(/kills required to use ability/gi, 'éliminations requises pour utiliser la capacité');
  fr = fr.replace(/Can be used (\d+) times/gi, 'Utilisable $1 fois');

  // 10. Transformations d'ennemis
  fr = fr.replace(/turns? into regular enemies/gi, 'se transforment en ennemis normaux');
  fr = fr.replace(/turn Cloners into regular enemies/gi, 'transformer les Cloneurs en ennemis normaux');
  fr = fr.replace(/Air enemies on the map that are affected by the ability will be targetable by ground units/gi, 'les ennemis aériens sur la carte affectés par la capacité deviennent ciblables par les unités terrestres');
  fr = fr.replace(/allows ground units to target affected air enemies/gi, 'permet aux unités terrestres de cibler les ennemis aériens affectés');

  // 11. Buffs et améliorations de stats
  fr = fr.replace(/Permanently increases base damage by\s*([\d,]+)/gi, 'Augmente définitivement les dégâts de base de $1');
  fr = fr.replace(/adds a permanent ([\d,]+) damage/gi, 'ajoute $1 dégâts permanents');
  fr = fr.replace(/boosts overall power/gi, 'augmente sa puissance globale');
  fr = fr.replace(/allows (?:him|her|them) to hit elementals/gi, 'lui permet de toucher les élémentaires');
  fr = fr.replace(/for (\d+)% of (?:his|her|their) damage/gi, 'pour $1% de ses dégâts');
  fr = fr.replace(/the player will gain/gi, 'le joueur reçoit');
  fr = fr.replace(/creates a domain within (\d+) (minutes|seconds)/gi, 'crée un domaine pendant $1 $2');
  fr = fr.replace(/constantly lose ([\d\.]+)% of their max HP/gi, 'perdent constamment $1% de leurs PV max');

  // 12. Invocations et Titans
  fr = fr.replace(/Gives\s*\$([\d,]+)\s*and spawns a Titan with\s*([\d,]+M?B?)\s*HP/gi, 'Donne \$$1 et fait apparaître un Titan avec $2 PV');
  fr = fr.replace(/Rewinds all enemies in (?:her|his|their) range for (\d+) seconds and spawns a Titan with\s*([\d,]+M?B?)\s*HP(?:\s*\(([\d,]+)\)\s*)?/gi, 'Remonte le temps pour tous les ennemis à portée pendant $1 secondes et fait apparaître un Titan de $2 PV');
  fr = fr.replace(/Spawns a Titan that can only hit air with\s*([\d,]+M?B?)\s*HP(?:\s*\(([\d,]+)\)\s*)?/gi, 'Fait apparaître un Titan ne touchant que les airs avec $1 PV');
  fr = fr.replace(/spawns a Titan with\s*([\d,]+M?B?)\s*HP/gi, 'fait apparaître un Titan avec $1 PV');
  fr = fr.replace(/During The Rumbling,\s*([^.]+?)\s*will spawn at the base and slowly march across the entire map/gi, 'Pendant le Grand Terrassement, $1 apparaissent à la base et marchent lentement sur toute la carte');

  // 13. Altérations instantanées sur attaques
  fr = fr.replace(/Attacks now stun enemies upon attack\./gi, 'Les attaques étourdissent désormais les ennemis à l\'impact.');
  fr = fr.replace(/Attacks now slow enemies upon attack\./gi, 'Les attaques ralentissent désormais les ennemis à l\'impact.');
  fr = fr.replace(/Attacks change to AoE Cone\./gi, 'Les attaques passent en zone (AoE Cône).');
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack,\s*([^.]+?)\s*deals? (\d+x) (?:his|her|their)?\s*base damage/gi, 'Toutes les $1 attaques, $2 inflige $3 ses dégâts de base');
  fr = fr.replace(/Every (\d+)(?:st|nd|rd|th)? attack,\s*([^.]+?)\s*does an attack which deals (\d+x) (?:his|her|their)?\s*base damage/gi, 'Toutes les $1 attaques, $2 effectue une attaque infligeant $3 ses dégâts de base');

  // 14. Durées, cumuls et limitations
  fr = fr.replace(/Cooldown:\s*~?(\d+)\s*seconds/gi, 'Temps de recharge : ~$1 secondes');
  fr = fr.replace(/Duration:\s*(\d+)\s*seconds/gi, 'Durée : $1 secondes');
  fr = fr.replace(/This ability doesn't stack with\s*([^.]+)/gi, 'Cette capacité ne se cumule pas avec $1');
  fr = fr.replace(/does NOT stack with\s*([^.]+)/gi, 'NE SE CUMULE PAS avec $1');
  fr = fr.replace(/does not stack with\s*([^.]+)/gi, 'ne se cumule pas avec $1');
  fr = fr.replace(/This ability also does not have a global cooldown\./gi, 'Cette capacité ne possède pas de temps de recharge global.');
  fr = fr.replace(/This ability doesn't have a global cooldown\./gi, 'Cette capacité ne possède pas de temps de recharge global.');
  fr = fr.replace(/Does not work on Boss enemies/gi, 'Ne fonctionne pas sur les ennemis Boss');
  fr = fr.replace(/excluding Air, Miniboss, and Boss enemies/gi, 'à l\'exclusion des ennemis Aériens, Miniboss et Boss');
  fr = fr.replace(/except for (?:Air|Steadfast), Miniboss,? and Boss enemies/gi, 'sauf les ennemis Imperturbables, Miniboss et Boss');

  // 15. Buffs d'équipe et de portée
  fr = fr.replace(/Buffs all units? within (?:his|her|their) range by (\d+)%(?:\s*\(or \d+x\))?\s*as well as buffing their range by (\d+)%/gi, 'Augmente l\'attaque de toutes les unités à portée de $1% et leur portée de $2%');
  fr = fr.replace(/This ability lasts for (\d+) seconds with a cooldown of (\d+) seconds/gi, 'Cette capacité dure $1 secondes avec un temps de recharge de $2 secondes');
  fr = fr.replace(/Units in the\s+['"]?([^'"]+?)['"]?\s+Category gain AttackBoost \+(\d+)%/gi, 'Les unités de la catégorie $1 bénéficient d\'un bonus d\'attaque de +$2%');

  // 16. Termes et vocabulaire général de combat ASTD
  fr = fr.replace(/\bSpecial Enemies\b/gi, 'ennemis spéciaux');
  fr = fr.replace(/\bSpecial Enemy\b/gi, 'ennemi spécial');
  fr = fr.replace(/\bElemental enemies\b/gi, 'ennemis élémentaires');
  fr = fr.replace(/\bElemental enemy\b/gi, 'ennemi élémentaire');
  fr = fr.replace(/\bEnchant enemies\b/gi, 'ennemis enchantés');
  fr = fr.replace(/\bregular enemies\b/gi, 'ennemis normaux');
  fr = fr.replace(/\bregular enemy\b/gi, 'ennemi normal');
  fr = fr.replace(/\bair enemies\b/gi, 'ennemis aériens');
  fr = fr.replace(/\bground enemies\b/gi, 'ennemis terrestres');
  fr = fr.replace(/\bair units\b/gi, 'unités aériennes');
  fr = fr.replace(/\bground units\b/gi, 'unités terrestres');
  fr = fr.replace(/\bcannot hit airs?\b/gi, 'ne peut pas toucher les unités aériennes');
  fr = fr.replace(/\bcannot hit ground\b/gi, 'ne peut pas toucher les unités terrestres');
  fr = fr.replace(/\bcan only hit air\b/gi, 'ne peut toucher que les unités aériennes');
  fr = fr.replace(/\bcan hit air\b/gi, 'peut toucher les unités aériennes');
  fr = fr.replace(/\bcan hit elementals\b/gi, 'peut toucher les élémentaires');
  fr = fr.replace(/\bdamage boost\b/gi, 'bonus de dégâts');
  fr = fr.replace(/\bdamage buff\b/gi, 'bonus de dégâts');
  fr = fr.replace(/\bAttack Boost\b/gi, 'bonus d\'attaque');
  fr = fr.replace(/\bAttackBoost\b/gi, 'bonus d\'attaque');
  fr = fr.replace(/\bAttack\b/g, 'Attaque');
  fr = fr.replace(/\bDamage\b/g, 'Dégâts');
  fr = fr.replace(/\bdamage\b/g, 'dégâts');
  fr = fr.replace(/\benemies\b/g, 'ennemis');
  fr = fr.replace(/\benemy\b/g, 'ennemi');
  fr = fr.replace(/\bcooldown\b/gi, 'temps de recharge');
  fr = fr.replace(/\bglobal cooldown\b/gi, 'temps de recharge global');
  fr = fr.replace(/\bseconds\b/gi, 'secondes');
  fr = fr.replace(/\bminutes\b/gi, 'minutes');
  fr = fr.replace(/\bBleed\b/gi, 'Saignement');
  fr = fr.replace(/\bJudgement\b/gi, 'Jugement');
  fr = fr.replace(/\bRupture\b/gi, 'Rupture');
  fr = fr.replace(/\bElectric\b/gi, 'Électrique');
  fr = fr.replace(/\bFire\b/gi, 'Feu');
  fr = fr.replace(/\bWater\b/gi, 'Eau');
  fr = fr.replace(/\bDark\b/gi, 'Ténèbres');
  fr = fr.replace(/\bLight\b/gi, 'Lumière');
  fr = fr.replace(/\bBillion\b/gi, 'milliards');
  fr = fr.replace(/\bMillion\b/gi, 'millions');
  fr = fr.replace(/\bThis ability\b/gi, 'Cette capacité');
  fr = fr.replace(/\bthis ability\b/gi, 'cette capacité');
  fr = fr.replace(/\bAt max upgrade\b/gi, 'Au palier maximum');
  fr = fr.replace(/\blast upgrade\b/gi, 'dernier palier');
  fr = fr.replace(/\bUpon attack\b/gi, 'À l\'attaque');
  fr = fr.replace(/\bupon attack\b/gi, 'à l\'impact');
  fr = fr.replace(/Lowers All Enemies to (\d+)% of their Maximum HP and Executes All Enemies Under (\d+)% of their Maximum HP/gi, 'Réduit tous les ennemis à $1% de leurs PV max et exécute tous les ennemis ayant moins de $2% de leurs PV max.');
  fr = fr.replace(/Activating this will collect the stored money\./gi, 'Activer cette aptitude collecte l\'argent stocké.');
  fr = fr.replace(/After collection, money generation is cancelled, so it should only be done when there is enough money to place all remaining troops\./gi, 'Après la collecte, la génération d\'argent est interrompue; cela ne doit être fait que lorsqu\'il y a assez d\'argent pour déployer toutes les troupes restantes.');
  fr = fr.replace(/Also, if collected before upgrading, the total amount of income will decrease depending on how much the ability is used\./gi, 'De plus, si collecté avant d\'améliorer, le revenu total diminuera selon la fréquence d\'utilisation de la capacité.');
  fr = fr.replace(/Ice Beam is a manual activation skill that does nothing\./gi, 'Ice Beam est une aptitude manuelle sans effet.');
  fr = fr.replace(/It also lacks a picture, having a transparent icon instead\./gi, 'Elle ne possède pas d\'illustration, utilisant une icône transparente.');

  return fr;
}

function translateUpgradeEffect(eff) {
  if (!eff || currentLang === 'en') return eff;
  let fr = eff;
  fr = fr.replace(/Unlocks\s+Ability/gi, "Débloque l'aptitude");
  fr = fr.replace(/Unlocks\s+(.+)/gi, 'Débloque $1');
  fr = fr.replace(/Changes\s+attack\s+type\s+to\s+(.+)/gi, "Change le type d'attaque en $1");
  fr = fr.replace(/Changes\s+to\s+(.+)/gi, 'Passe à $1');
  fr = fr.replace(/Enchant enemy with\s+(.+)/gi, 'Enchante les ennemis avec $1');
  fr = fr.replace(/\bDamage Buff\b/gi, 'Buff de Dégâts');
  fr = fr.replace(/\bRange Buff\b/gi, 'Buff de Portée');
  fr = fr.replace(/\bProvides\s*per\s*wave\b/gi, 'Fournit par vague');
  fr = fr.replace(/\bProvides\b/gi, 'Fournit');
  fr = fr.replace(/\bElectric\b/gi, 'Électrique');
  fr = fr.replace(/\bFire\b/gi, 'Feu');
  fr = fr.replace(/\bWater\b/gi, 'Eau');
  fr = fr.replace(/\bDark\b/gi, 'Ténèbres');
  fr = fr.replace(/\bLight\b/gi, 'Lumière');
  fr = fr.replace(/\bAir\b/gi, 'Aérien');
  fr = fr.replace(/\bGround\b/gi, 'Terrestre');
  fr = fr.replace(/\bHill\b/gi, 'Colline');
  fr = fr.replace(/\bHybrid\b/gi, 'Hybride');
  fr = fr.replace(/Leader Skill/gi, 'Compétence de Leader');
  fr = fr.replace(/\bManual Ability\b/gi, 'Aptitude Manuelle');
  fr = fr.replace(/\bPassive Ability\b/gi, 'Passif');
  fr = fr.replace(/\bBurn\b/gi, 'Brûlure');
  fr = fr.replace(/\bBleed\b/gi, 'Saignement');
  fr = fr.replace(/\bSlow\b/gi, 'Ralentissement');
  fr = fr.replace(/\bFreeze\b/gi, 'Gel');
  fr = fr.replace(/\bStun\b/gi, 'Étourdissement');
  return fr;
}

function translateReward(text) {
  if (!text) return '';
  if (currentLang === 'fr') {
    return text
      .replace(/\bGems\b/gi, 'Gemmes')
      .replace(/\bStardust\b/gi, "Poussière d'étoiles")
      .replace(/Required\s*:\s*Level/gi, 'Requis : Niveau')
      .replace(/Level\s*(\d+)\+/gi, 'Niveau $1+')
      .replace(/and/gi, 'et')
      .replace(/Supplies/gi, 'Ravitaillement');
  } else {
    return text
      .replace(/\bGemmes\b/gi, 'Gems')
      .replace(/Poussières? d'étoiles/gi, 'Stardust')
      .replace(/Requis\s*:\s*(?:Niveau|Level)/gi, 'Required: Level')
      .replace(/Niveau\s*(\d+)\+/gi, 'Level $1+')
      .replace(/\bet\b/gi, 'and')
      .replace(/Ravitaillement/gi, 'Supplies');
  }
}

function translateOrbEffect(eff) {
  if (!eff) return '';
  if (currentLang === 'fr') {
    return eff
      .replace(/Increase(?:s)? Damage by/gi, "Augmente les dégâts de")
      .replace(/Increase(?:s)? Range by/gi, "Augmente la portée de")
      .replace(/Decrease(?:s)? (?:SPA|Cooldown) by/gi, "Réduit le SPA de")
      .replace(/Allows unit to hit Air/gi, "Permet de toucher les unités aériennes")
      .replace(/All units/gi, "Toutes les unités");
  } else {
    return eff
      .replace(/Augmente les dégâts de/gi, "Increases Damage by")
      .replace(/Augmente la portée de/gi, "Increases Range by")
      .replace(/Réduit le SPA de/gi, "Decreases SPA by")
      .replace(/Permet de toucher les unités aériennes/gi, "Allows unit to hit Air")
      .replace(/Toutes les unités/gi, "All units");
  }
}

// Multiplicateurs officiels du wiki (template "Stats Box", section Level 175) :
// dégâts ×2.142, portée ×1.2, SPA inchangé. Vérifiés sur Stampede (???%),
// Joke Da Fool et Demon Of Emotion contre le HTML rendu du wiki.
const LEVEL_175 = { damage: 2.142, range: 1.2, spa: 1 };

// ==========================================
// BUFF DE DÉGÂTS IDOL (aptitude Shine)
// ==========================================
// Les unités « donneuses » de buff (Idol, Metallic King) portent sur chaque
// palier le % de buff de dégâts qu'elles offrent aux unités à portée :
// buff_damage_low = valeur à Level 1, buff_damage_high = valeur à Level 175
// (plafonnée par le jeu, ex. 250% pour Idol au palier max).
let idolBuffEnabled = false;
let idolBuffToggleHidden = true; // masquée sur la fiche de la donneuse elle-même

// L'unité courante propose-t-elle un buff de dégâts sur ses paliers ?
function unitHasDamageBuff(unit) {
  return (unit.upgrades || []).some(up => up.buff_damage_low != null);
}

// Unité de référence pour la simulation : Idol en priorité, sinon la 1re donneuse
function findBuffProvider() {
  return ALL_UNITS.find(u => u.name === 'Idol' && unitHasDamageBuff(u))
      || ALL_UNITS.find(u => unitHasDamageBuff(u))
      || null;
}

// % de buff au palier max de la donneuse, pour le niveau de carte affiché
// (Level 1 -> 130% pour Idol, Level 175 -> 250%, le plafond du jeu)
function buffProviderPercent() {
  const p = findBuffProvider();
  if (!p) return null;
  let low = 0, high = 0;
  p.upgrades.forEach(up => {
    if (up.buff_damage_low != null) low = Math.max(low, up.buff_damage_low);
    if (up.buff_damage_high != null) high = Math.max(high, up.buff_damage_high);
  });
  const pct = currentLevelView === 175 ? (high || low) : (low || high);
  return pct || null;
}

// Multiplicateur de dégâts appliqué à l'unité affichée quand la case est cochée
function idolBuffMultiplier() {
  const pct = idolBuffEnabled ? buffProviderPercent() : null;
  return pct ? 1 + pct / 100 : 1;
}

// Case à cocher « Buff Idol » : style actif/inactif + % courant
function updateIdolBuffToggleUI() {
  const wrap = document.getElementById('idol-buff-toggle-wrap');
  const pctEl = document.getElementById('idol-buff-pct');
  const pct = buffProviderPercent();
  if (pctEl && pct != null) pctEl.textContent = `+${pct}%`;
  if (!wrap) return;
  // Conserver l'état hidden (masquée sur la fiche d'Idol elle-même)
  const hiddenCls = idolBuffToggleHidden ? ' hidden' : '';
  const base = 'cursor-pointer select-none px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5';
  wrap.className = `${base} ${idolBuffEnabled
    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-violet-400/50 hover:text-violet-300'}${hiddenCls}`;
}

// Note explicative sous l'en-tête quand la simulation est active
function updateIdolBuffNote() {
  const note = document.getElementById('modal-idolbuff-note');
  const pctEl = document.getElementById('modal-idolbuff-pct');
  if (!note) return;
  note.classList.toggle('hidden', !idolBuffEnabled);
  if (idolBuffEnabled && pctEl) {
    pctEl.textContent = `+${buffProviderPercent() || 0}%`;
  }
}

function toggleIdolBuff() {
  const cb = document.getElementById('idol-buff-toggle');
  idolBuffEnabled = !!(cb && cb.checked);
  updateIdolBuffToggleUI();
  updateIdolBuffNote();
  renderModalHeaderStats();
  renderUpgradesTable();
}

// Fenêtre « NOUVEAU » : date de création de la fiche wiki (created_at) sur
// moins de 30 jours. Le badge signale les unités récemment ajoutées au jeu.
const NEW_UNIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function isNewUnit(unit) {
  if (!unit.created_at) return false;
  return Date.now() - new Date(unit.created_at).getTime() < NEW_UNIT_WINDOW_MS;
}

// ==========================================
// CONFIGURATION ET SÉCURITÉ PUBLICITAIRE (OPTION A)
// ==========================================
// ==========================================
// CONFIGURATION ET SÉCURITÉ PUBLICITAIRE (OPTION A)
// ==========================================
// Les annonces ne sont activées QUE sur le domaine de production officiel.
// Sur localhost, forks GitHub ou tests locaux, aucun script externe n'est chargé
// et les skyscrapers latéraux restent totalement masqués.
const ADS_CONFIG = {
  allowedHosts: ['dztic.github.io'],
  client: 'ca-pub-9302236726754340',
  slotLeft: '2599124005',
  slotRight: '2599124005'
};

function initSafeAds() {
  const leftAside = document.getElementById('ad-skyscraper-left');
  const rightAside = document.getElementById('ad-skyscraper-right');
  const leftContent = document.getElementById('ad-skyscraper-left-content');
  const rightContent = document.getElementById('ad-skyscraper-right-content');

  const currentHost = window.location.hostname;
  const isAuthorized = ADS_CONFIG.allowedHosts.includes(currentHost);
  const isConfigured = ADS_CONFIG.client && !ADS_CONFIG.client.includes('REPLACE_ME');
  const isDesktopWide = window.innerWidth >= 1680;

  // Garde-fou 1 : domaine non autorisé (ex: localhost, ou fork tiers)
  // Garde-fou 2 : identifiant non encore renseigné
  // Garde-fou 3 : écran mobile, tablette ou bureau standard (< 1680px)
  if (!isAuthorized || !isConfigured || !isDesktopWide) {
    if (leftAside) {
      leftAside.classList.remove('ad-visible');
      leftAside.classList.add('hidden');
    }
    if (rightAside) {
      rightAside.classList.remove('ad-visible');
      rightAside.classList.add('hidden');
    }
    return;
  }

  // Domaine autorisé, compte configuré ET moniteur ultra-large (>= 1680px)
  if (leftAside) {
    leftAside.classList.add('ad-visible');
    leftAside.classList.remove('hidden');
  }
  if (rightAside) {
    rightAside.classList.add('ad-visible');
    rightAside.classList.remove('hidden');
  }

  if (leftContent && !leftContent.querySelector('ins.adsbygoogle')) {
    leftContent.innerHTML = `
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="${ADS_CONFIG.client}"
           data-ad-slot="${ADS_CONFIG.slotLeft}"
           data-ad-format="vertical"></ins>
    `;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense left init error', e);
    }
  }

  if (rightContent && !rightContent.querySelector('ins.adsbygoogle')) {
    rightContent.innerHTML = `
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="${ADS_CONFIG.client}"
           data-ad-slot="${ADS_CONFIG.slotRight}"
           data-ad-format="vertical"></ins>
    `;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense right init error', e);
    }
  }

  if (!document.getElementById('adsense-script')) {
    const script = document.createElement('script');
    script.id = 'adsense-script';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.client}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
}

// Réévaluation automatique lors du redimensionnement de la fenêtre
let adResizeDebounce = null;
window.addEventListener('resize', () => {
  clearTimeout(adResizeDebounce);
  adResizeDebounce = setTimeout(() => {
    initSafeAds();
  }, 200);
});

// ==========================================
// Pop-up d'accueil & Annonce Soutien Publicitaire
// S'affiche une seule fois grâce au localStorage
// ==========================================
function openAdsNoticeModal() {
  const modal = document.getElementById('ads-notice-modal');
  const dialog = document.getElementById('ads-notice-dialog');
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.remove('closing');
  if (dialog) {
    dialog.classList.remove('modal-exit');
    dialog.classList.add('modal-enter');
  }
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  if (window.lucide) lucide.createIcons();

  const confirmBtn = document.getElementById('ads-notice-confirm-btn');
  if (confirmBtn) {
    setTimeout(() => {
      try { confirmBtn.focus(); } catch (e) {}
    }, 60);
  }
}

function closeAdsNoticeModal() {
  try {
    localStorage.setItem('astd_ads_notice_dismissed', '1');
  } catch (e) {}

  const modal = document.getElementById('ads-notice-modal');
  const dialog = document.getElementById('ads-notice-dialog');
  if (!modal || modal.classList.contains('hidden')) return;

  const onClosed = () => {
    const unitModal = document.getElementById('unit-modal');
    const communityModal = document.getElementById('community-modal');
    const isOtherModalOpen = (unitModal && !unitModal.classList.contains('hidden')) ||
                             (communityModal && !communityModal.classList.contains('hidden'));
    if (!isOtherModalOpen) {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  };

  if (dialog) {
    dialog.classList.remove('modal-enter');
    dialog.classList.add('modal-exit');
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('closing');
      dialog.classList.remove('modal-exit');
      onClosed();
    }, 150);
  } else {
    modal.classList.add('hidden');
    onClosed();
  }
}

function checkAdsNotice() {
  try {
    const dismissed = localStorage.getItem('astd_ads_notice_dismissed');
    if (!dismissed) {
      setTimeout(() => {
        openAdsNoticeModal();
      }, 400);
    }
  } catch (e) {}
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  initSafeAds();
  checkAdsNotice();
});

// Load all JSON datasets
async function loadData() {
  try {
    const dataPrefix = window.location.pathname.includes('/public/') ? '../data/' : './data/';
    const [unitsRes, codesRes, orbsRes, tierRes, modesRes, metaRes, matImagesRes] = await Promise.all([
      fetch(`${dataPrefix}units.json`).then(r => r.json()),
      fetch(`${dataPrefix}codes.json`).then(r => r.json()),
      fetch(`${dataPrefix}orbs.json`).then(r => r.json()),
      fetch(`${dataPrefix}tierlist.json`).then(r => r.json()),
      fetch(`${dataPrefix}gamemodes.json`).then(r => r.json()),
      fetch(`${dataPrefix}meta.json`).then(r => r.json()).catch(() => ({})),
      fetch(`${dataPrefix}material_images.json`).then(r => r.json()).catch(() => ({}))
    ]);

    if (Array.isArray(unitsRes)) {
      unitsRes.forEach(u => {
        if (u.anime_origin) u.anime_origin = u.anime_origin.replace(/<[^>]*>/g, '').trim();
        if (u.character_origin) u.character_origin = u.character_origin.replace(/<[^>]*>/g, '').trim();
      });
    }
    ALL_UNITS = unitsRes;
    // Le tableau du wiki n'est pas trié par date : on met les codes les plus récents en premier
    if (Array.isArray(codesRes.active)) {
      codesRes.active.sort((a, b) => codeTimestamp(b) - codeTimestamp(a));
    }
    CODES_DATA = codesRes;
    ORBS_DATA = orbsRes;
    TIERLIST_DATA = tierRes;
    GAMEMODES_DATA = modesRes;
    META_DATA = metaRes;
    MATERIAL_IMAGES = matImagesRes || {};

    // Intégrer les ajouts et modifications de la communauté
    if (window.CommunityManager) {
      await CommunityManager.init();
      CommunityManager.applyToGlobalData();
    }

    // Header & Analytics metrics
    const unitsCountEl = document.getElementById('stat-units-count');
    if (unitsCountEl) unitsCountEl.textContent = ALL_UNITS.length.toLocaleString();

    const orbsCountEl = document.getElementById('stat-orbs-count');
    if (orbsCountEl) orbsCountEl.textContent = ORBS_DATA.length;

    const activeBadge = document.getElementById('badge-active-codes');
    if (activeBadge) activeBadge.textContent = CODES_DATA.active.length;

    const ribbonUpdated = document.getElementById('stat-last-updated');
    if (ribbonUpdated && META_DATA.last_updated) {
      const [datePart] = META_DATA.last_updated.split(' ');
      const [y, m, d] = datePart.split('-');
      ribbonUpdated.textContent = `${d}/${m}/${y}`;
    }

    // Populate the anime/franchise filter (sorted by number of units, then A-Z)
    const animeSelect = document.getElementById('filter-anime');
    if (animeSelect) {
      const counts = {};
      ALL_UNITS.forEach(u => {
        const a = (u.anime_origin || '').replace(/<[^>]*>/g, '').trim();
        if (a) counts[a] = (counts[a] || 0) + 1;
      });
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .forEach(([name, count]) => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = `${name} (${count})`;
          animeSelect.appendChild(opt);
        });
      animeSelect.addEventListener('change', applyUnitFilters);
    }

    // Apply initial localization
    setLanguage(currentLang);

    // Hero latest code
    if (CODES_DATA.active && CODES_DATA.active.length > 0) {
      const topCode = CODES_DATA.active[0];
      const codeName = document.getElementById('hero-code-name');
      if (codeName) codeName.textContent = topCode.code;
    }

    // Render Initial Views
    applyUnitFilters();
    renderTierList();
    renderCodes();
    renderOrbs();
    renderGameModes();
    renderTeamBuilder();

    // Check URL Hash
    handleHashNavigation();

  } catch (error) {
    console.error('Erreur lors du chargement des données ASTD:', error);
  }
}

// Event Listeners Setup
function setupEventListeners() {
  const searchInput = document.getElementById('filter-search');
  const sortSelect = document.getElementById('filter-sort');
  const typeSelect = document.getElementById('filter-tower-type');
  const obtainableCheck = document.getElementById('filter-obtainable');
  const quickSearch = document.getElementById('quick-search');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
      applyUnitFilters();
    });
  }

  if (quickSearch) {
    quickSearch.addEventListener('input', (e) => {
      switchTab('units');
      if (searchInput) {
        searchInput.value = e.target.value;
        document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
        applyUnitFilters();
      }
    });
  }

  const mobileSearch = document.getElementById('mobile-search-input');
  if (mobileSearch) {
    mobileSearch.addEventListener('input', (e) => {
      switchTab('units');
      if (searchInput) {
        searchInput.value = e.target.value;
        document.getElementById('clear-search')?.classList.toggle('hidden', !searchInput.value);
        applyUnitFilters();
      }
    });
  }

  if (sortSelect) sortSelect.addEventListener('change', applyUnitFilters);
  if (typeSelect) typeSelect.addEventListener('change', applyUnitFilters);
  if (obtainableCheck) obtainableCheck.addEventListener('change', applyUnitFilters);

  // Global shortcut Ctrl+K to search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      focusMainSearch();
    }
    if (e.key === 'Escape') {
      closeAdsNoticeModal();
      closeUnitModal();
    }
  });

  // Modal notice publicitaire backdrop click
  const adsNoticeModal = document.getElementById('ads-notice-modal');
  if (adsNoticeModal) {
    adsNoticeModal.addEventListener('click', (e) => {
      if (e.target === adsNoticeModal) closeAdsNoticeModal();
    });
  }

  // Modal backdrop click & focus trap
  const modal = document.getElementById('unit-modal');
  const modalDialog = document.getElementById('unit-modal-dialog');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeUnitModal();
    });

    // Empêcher le défilement de fuiter vers l'arrière-plan (wheel & touch)
    modal.addEventListener('wheel', (e) => {
      let target = e.target;
      let scrollable = null;
      while (target && target !== modal && target !== document.body) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          scrollable = target;
          break;
        }
        target = target.parentElement;
      }

      if (!scrollable) {
        // Aucune zone défilable sous le curseur (fiche courte, header, backdrop)
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const deltaY = e.deltaY;
      if (deltaY > 0 && Math.ceil(scrollTop + clientHeight) >= scrollHeight) {
        // Fin de défilement vers le bas : bloquer pour éviter de faire défiler l'arrière-plan
        e.preventDefault();
      } else if (deltaY < 0 && scrollTop <= 0) {
        // Début de défilement vers le haut : bloquer pour éviter de faire défiler l'arrière-plan
        e.preventDefault();
      }
    }, { passive: false });

    let modalTouchStartY = 0;
    modal.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        modalTouchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = modalTouchStartY - currentY;

      let target = e.target;
      let scrollable = null;
      while (target && target !== modal && target !== document.body) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          scrollable = target;
          break;
        }
        target = target.parentElement;
      }

      if (!scrollable) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      if (deltaY > 0 && Math.ceil(scrollTop + clientHeight) >= scrollHeight) {
        e.preventDefault();
      } else if (deltaY < 0 && scrollTop <= 0) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  if (modalDialog) {
    modalDialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = modalDialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });
  }

  window.addEventListener('hashchange', handleHashNavigation);
}

function focusMainSearch() {
  switchTab('units');
  setTimeout(() => {
    const input = document.getElementById('filter-search') || document.getElementById('quick-search');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 50);
}

// Handle URL Hash navigation
function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('unit/')) {
    const unitId = hash.replace('unit/', '');
    openUnitModal(unitId);
  } else {
    const modal = document.getElementById('unit-modal');
    if (modal && !modal.classList.contains('hidden')) {
      closeUnitModal();
    }
    if (hash.startsWith('compare')) {
      const parts = hash.split('/');
      if (parts[1]) {
        const uA = ALL_UNITS.find(u => u.id === parts[1] || u.name.toLowerCase() === parts[1].toLowerCase());
        if (uA) {
          compareUnitA = uA;
          const inputA = document.getElementById('compare-search-a');
          if (inputA) inputA.value = uA.name;
          const clearBtnA = document.getElementById('compare-clear-a');
          if (clearBtnA) clearBtnA.classList.remove('hidden');
        }
      }
      if (parts[2]) {
        const uB = ALL_UNITS.find(u => u.id === parts[2] || u.name.toLowerCase() === parts[2].toLowerCase());
        if (uB) {
          compareUnitB = uB;
          const inputB = document.getElementById('compare-search-b');
          if (inputB) inputB.value = uB.name;
          const clearBtnB = document.getElementById('compare-clear-b');
          if (clearBtnB) clearBtnB.classList.remove('hidden');
        }
      }
      switchTab('compare');
      renderCompareView();
    } else if (['units', 'tierlist', 'codes', 'orbs', 'gamemodes', 'teambuilder', 'compare', 'community'].includes(hash)) {
      if (currentTab !== hash) {
        switchTab(hash);
      }
    }
  }
}

// Switch Active Tab
function switchTab(tabId) {
  const modal = document.getElementById('unit-modal');
  if (modal && !modal.classList.contains('hidden')) {
    closeUnitModal();
  }
  currentTab = tabId;
  window.location.hash = tabId;

  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });
  const targetSection = document.getElementById(`tab-${tabId}`);
  if (targetSection) targetSection.classList.remove('hidden');

  if (tabId === 'compare') {
    renderCompareView();
  }
  if (tabId === 'community') {
    if (window.CommunityManager) CommunityManager.renderCommunityHub();
  }

  updateNavActiveState(tabId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}

function updateNavActiveState(tabId) {
  // 1. Desktop Nav Links
  document.querySelectorAll('.nav-link').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId || btn.id === `nav-${tabId}`;
    const icon = btn.querySelector('i');
    if (isTarget) {
      btn.className = 'nav-link whitespace-nowrap shrink-0 ps-3 pe-3.5 py-1.5 rounded-lg text-xs xl:text-sm font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 tap-scale';
      if (icon) {
        icon.classList.remove('text-slate-400');
        icon.classList.add('text-sky-400');
      }
    } else {
      btn.className = 'nav-link whitespace-nowrap shrink-0 ps-3 pe-3.5 py-1.5 rounded-lg text-xs xl:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent flex items-center gap-1.5 tap-scale';
      if (icon) {
        icon.classList.remove('text-sky-400');
        icon.classList.add('text-slate-400');
      }
    }
  });

  // 2. Mobile Chips
  document.querySelectorAll('.mobile-chip-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    if (isTarget) {
      btn.className = 'mobile-chip-btn whitespace-nowrap shrink-0 ps-2.5 pe-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 tap-scale';
    } else {
      btn.className = 'mobile-chip-btn whitespace-nowrap shrink-0 ps-2.5 pe-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 flex items-center gap-1.5 tap-scale';
    }
  });

  // 3. Mobile Drawer
  document.querySelectorAll('.drawer-link').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    if (isTarget) {
      btn.className = 'drawer-link p-2.5 rounded-lg text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-500/40 flex items-center gap-2 tap-scale';
    } else {
      btn.className = 'drawer-link p-2.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-2 hover:bg-slate-800 tap-scale';
    }
  });
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const icon = document.getElementById('hamburger-icon');
  if (drawer) {
    const isHidden = drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden');
    if (icon) {
      icon.setAttribute('data-lucide', isHidden ? 'x' : 'menu');
      if (window.lucide) lucide.createIcons();
    }
  }
}

function switchTabAndCloseDrawer(tabId) {
  switchTab(tabId);
  const drawer = document.getElementById('mobile-drawer');
  const icon = document.getElementById('hamburger-icon');
  if (drawer && !drawer.classList.contains('hidden')) {
    drawer.classList.add('hidden');
    if (icon) {
      icon.setAttribute('data-lucide', 'menu');
      if (window.lucide) lucide.createIcons();
    }
  }
}

// Number formatting utility (Compact e.g. 1.2M, 350K)
function formatCompactNumber(num) {
  if (!num || isNaN(num) || num === 0) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString();
}

// ==========================================
// VIEW SWITCHER (GRID VS PRO TABLE)
// ==========================================

function setViewMode(mode) {
  currentViewMode = mode;
  const gridEl = document.getElementById('units-grid');
  const tableContainer = document.getElementById('units-table-container');
  const loadMoreBtn = document.getElementById('load-more-container');
  const btnGrid = document.getElementById('btn-view-grid');
  const btnTable = document.getElementById('btn-view-table');

  if (mode === 'table') {
    gridEl?.classList.add('hidden');
    tableContainer?.classList.remove('hidden');
    loadMoreBtn?.classList.add('hidden');

    if (btnTable) {
      btnTable.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-white bg-sky-600 flex items-center justify-center space-x-1 tap-scale';
      btnTable.setAttribute('aria-pressed', 'true');
    }
    if (btnGrid) {
      btnGrid.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center space-x-1 tap-scale';
      btnGrid.setAttribute('aria-pressed', 'false');
    }

    renderUnitsTable();
  } else {
    gridEl?.classList.remove('hidden');
    tableContainer?.classList.add('hidden');

    if (btnGrid) {
      btnGrid.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-white bg-sky-600 flex items-center justify-center space-x-1 tap-scale';
      btnGrid.setAttribute('aria-pressed', 'true');
    }
    if (btnTable) {
      btnTable.className = 'flex-1 py-1 ps-2 pe-2.5 rounded text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center space-x-1 tap-scale';
      btnTable.setAttribute('aria-pressed', 'false');
    }

    renderUnitsList();
  }
}

function sortTableBy(field) {
  if (currentTableSort.field === field) {
    currentTableSort.direction = currentTableSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentTableSort.field = field;
    currentTableSort.direction = 'desc';
  }

  FILTERED_UNITS.sort((a, b) => {
    let valA = a[field] || 0;
    let valB = b[field] || 0;
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return currentTableSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return currentTableSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  renderUnitsTable();
}

// ==========================================
// UNIT FILTERS & RENDERING
// ==========================================

function setStarFilter(star, btnElement) {
  currentStarFilter = star;
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-sky-600', 'text-white', 'border-sky-500');
    btn.classList.add('bg-slate-900/90', 'text-slate-300', 'border-slate-800');
    btn.setAttribute('aria-pressed', 'false');
  });

  const targetBtn = btnElement || (window.event && window.event.currentTarget)
    || document.querySelector(`.star-btn[onclick*="'${star}'"]`)
    || document.querySelector(`.star-btn[onclick*="${star}"]`);

  if (targetBtn) {
    targetBtn.classList.add('active', 'bg-sky-600', 'text-white', 'border-sky-500');
    targetBtn.classList.remove('bg-slate-900/90', 'text-slate-300', 'border-slate-800');
    targetBtn.setAttribute('aria-pressed', 'true');
  }

  applyUnitFilters();
}

function clearSearch() {
  const searchInput = document.getElementById('filter-search');
  if (searchInput) searchInput.value = '';
  document.getElementById('clear-search')?.classList.add('hidden');
  applyUnitFilters();
}

function clearAllFilters() {
  const searchInput = document.getElementById('filter-search');
  const typeSelect = document.getElementById('filter-tower-type');
  const sortSelect = document.getElementById('filter-sort');
  const animeSelect = document.getElementById('filter-anime');
  const obtainableCheck = document.getElementById('filter-obtainable');
  const quickSearch = document.getElementById('quick-search');

  if (searchInput) searchInput.value = '';
  if (quickSearch) quickSearch.value = '';
  if (typeSelect) typeSelect.value = 'all';
  if (sortSelect) sortSelect.value = 'recent-desc';
  if (animeSelect) animeSelect.value = 'all';
  if (obtainableCheck) obtainableCheck.checked = false;
  document.getElementById('clear-search')?.classList.add('hidden');

  setStarFilter('all');
}

function applyUnitFilters() {
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const sort = document.getElementById('filter-sort')?.value || 'star-desc';
  const typeFilter = document.getElementById('filter-tower-type')?.value || 'all';
  const animeFilter = document.getElementById('filter-anime')?.value || 'all';
  const obtainableOnly = document.getElementById('filter-obtainable')?.checked || false;

  FILTERED_UNITS = ALL_UNITS.filter(u => {
    if (currentStarFilter !== 'all' && u.star !== parseInt(currentStarFilter)) return false;
    if (typeFilter !== 'all') {
      const uType = (u.tower_type || '').toLowerCase();
      if (!uType.includes(typeFilter.toLowerCase())) return false;
    }
    if (animeFilter !== 'all' && (u.anime_origin || '').trim() !== animeFilter) return false;
    if (obtainableOnly && u.is_unobtainable) return false;

    if (search) {
      const matchName = u.name.toLowerCase().includes(search);
      const matchAnime = (u.anime_origin || '').toLowerCase().includes(search);
      const matchChar = (u.character_origin || '').toLowerCase().includes(search);
      const matchOverview = (u.overview || '').toLowerCase().includes(search);
      if (!matchName && !matchAnime && !matchChar && !matchOverview) return false;
    }

    return true;
  });

  // Sort
  FILTERED_UNITS.sort((a, b) => {
    switch (sort) {
      case 'recent-desc':
        return (b.created_at || '').localeCompare(a.created_at || '')
            || b.star - a.star || (b.max_damage || 0) - (a.max_damage || 0);
      case 'star-desc':
        return b.star - a.star || (b.max_damage || 0) - (a.max_damage || 0);
      case 'star-asc':
        return a.star - b.star || (a.max_damage || 0) - (b.max_damage || 0);
      case 'dmg-desc':
        return (b.max_damage || 0) - (a.max_damage || 0);
      case 'dps-desc':
        return (b.max_dps || 0) - (a.max_dps || 0);
      case 'cost-asc':
        return (a.total_cost || 0) - (b.total_cost || 0);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  displayedCount = pageSize;

  if (currentViewMode === 'table') {
    renderUnitsTable();
  } else {
    renderUnitsList();
  }
}

function renderUnitsList() {
  const grid = document.getElementById('units-grid');
  const countEl = document.getElementById('results-count');
  const loadMoreBtn = document.getElementById('load-more-container');

  if (countEl) {
    const unitWord = currentLang === 'en' ? (FILTERED_UNITS.length > 1 ? 'units' : 'unit') : (FILTERED_UNITS.length > 1 ? 'unités' : 'unité');
    countEl.textContent = `${FILTERED_UNITS.length} ${unitWord}`;
  }

  if (FILTERED_UNITS.length === 0) {
    const searchVal = document.getElementById('filter-search')?.value?.trim() || '';
    grid.innerHTML = `
      <div class="col-span-full py-12 px-6 text-center text-slate-300 tactical-card rounded-2xl border border-slate-800 my-4 max-w-md mx-auto">
        <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-sky-400">
          <i data-lucide="search-x" class="w-6 h-6" stroke-width="2"></i>
        </div>
        <h3 class="text-sm font-bold text-white text-balance">${t('no_matching_units', 'Aucune unité ne correspond à vos filtres')}</h3>
        <p class="text-xs text-slate-400 mt-1 text-pretty">
          ${searchVal ? t('no_results_for', 'Aucun résultat pour « {searchVal} ».').replace('{searchVal}', `<strong class="text-white">${searchVal}</strong>`) : t('no_results_combo', 'Aucune unité disponible avec la combinaison de rareté et type sélectionnés.')}
        </p>
        <button onclick="clearAllFilters()" class="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tap-scale inline-flex items-center gap-1.5 shadow-md">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5" stroke-width="2"></i>
          <span>${t('reset_filters', 'Réinitialiser les filtres')}</span>
        </button>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
    return;
  }

  const unitsToShow = FILTERED_UNITS.slice(0, displayedCount);
  grid.innerHTML = unitsToShow.map(u => createUnitCardHTML(u)).join('');

  if (loadMoreBtn) {
    loadMoreBtn.classList.toggle('hidden', displayedCount >= FILTERED_UNITS.length);
  }

  if (window.lucide) lucide.createIcons();
}

function renderUnitsTable() {
  const tbody = document.getElementById('units-table-tbody');
  const countEl = document.getElementById('results-count');
  if (countEl) {
    const unitWord = currentLang === 'en' ? (FILTERED_UNITS.length > 1 ? 'units' : 'unit') : (FILTERED_UNITS.length > 1 ? 'unités' : 'unité');
    countEl.textContent = `${FILTERED_UNITS.length} ${unitWord}`;
  }

  if (!tbody) return;

  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";

  tbody.innerHTML = FILTERED_UNITS.slice(0, 150).map(u => `
    <tr class="hover:bg-slate-800/60 transition-colors duration-100 cursor-pointer" onclick="openUnitModal('${u.id}')" tabindex="0" role="button" aria-label="${u.name}, ${u.star}★. ${t('table_view_sheet', 'Voir la fiche.')}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openUnitModal('${u.id}');}">
      <td class="p-3 flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-0.5 shrink-0 flex items-center justify-center">
          <img src="${u.image || fallbackImg}" alt="" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
        </div>
        <div class="min-w-0 font-sans">
          <div class="font-bold text-white truncate">${u.name}</div>
          <div class="text-[10px] text-slate-400 truncate">${u.anime_origin || u.character_origin || '-'}</div>
        </div>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[11px] font-bold star-${u.star}-badge font-mono-num">${u.star}★</span>
        ${u._is_community_new ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide">${t('badge_community', 'Communauté')}</span>` : ''}
        ${u._is_community_modified ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">${t('badge_modified', 'Modifié')}</span>` : ''}
        ${isNewUnit(u) && !u._is_community_new ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="${t('wiki_page_created_on', 'Fiche wiki créée le')} ${new Date(u.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR')}">${t('badge_new', 'Nouveau')}</span>` : ''}
      </td>
      <td class="p-3 font-sans">
        <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-semibold">${translateTowerType(u.tower_type)}</span>
      </td>
      <td class="p-3 font-bold text-slate-100 font-mono-num" title="${u.max_damage.toLocaleString()} DMG">${formatCompactNumber(u.max_damage)}</td>
      <td class="p-3 text-slate-300 font-mono-num">${u.max_range || '-'}</td>
      <td class="p-3 text-slate-400 font-mono-num">${u.min_spa ? u.min_spa + 's' : '-'}</td>
      <td class="p-3 font-bold text-amber-300 font-mono-num" title="${u.max_dps.toLocaleString()} DPS">${formatCompactNumber(u.max_dps)}</td>
      <td class="p-3 text-slate-300 font-mono-num">${u.total_cost > 0 ? '$' + formatCompactNumber(u.total_cost) : '-'}</td>
      <td class="p-3 text-right space-x-1.5 font-sans" onclick="event.stopPropagation()">
        <button onclick="openUnitModal('${u.id}')" aria-label="${t('btn_card', 'Fiche')} : ${u.name}" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale transition-colors">
          ${t('btn_card', 'Fiche')}
        </button>
        <button onclick="startCompareWith('${u.id}')" aria-label="${t('btn_compare_title', 'Comparer cette unité')} ${u.name}" class="px-2 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale transition-colors" title="${t('btn_compare_title', 'Comparer cette unité')}">
          ⇄
        </button>
        <button onclick="addUnitToTeam('${u.id}')" aria-label="${t('btn_add_deck_title', 'Ajouter au deck')} ${u.name}" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-[10px] font-semibold tap-scale transition-colors" title="${t('btn_add_deck_title', 'Ajouter au deck')}">
          +
        </button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function loadMoreUnits() {
  displayedCount += pageSize;
  renderUnitsList();
}

// Safety net: strip any leftover wiki markup at render time
function stripWikiMarkup(text) {
  if (!text) return '';
  // Inside a wiki link, the readable part is the label, or the anchor if only
  // "Page#Anchor" survived (truncated links from nested templates).
  const linkText = (m, inner) => {
    let t = inner.trim();
    if (t.includes('#')) t = t.split('#').pop() || t;
    return t.replace(/_/g, ' ');
  };
  return text
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/\{\|[\s\S]*?\|\}/g, ' ')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, linkText)
    .replace(/\[\[?([^\[\]]+)\]*/g, linkText)
    .replace(/'{2,3}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tactical Unit Card Generator (Accessible, High Contrast, Keyboard navigable)
function createUnitCardHTML(unit) {
  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  const imgSrc = unit.image || fallbackImg;
  const originLine = unit.anime_origin || unit.character_origin || 'All Star Tower Defense';

  return `
    <article class="tactical-card rounded-xl p-3.5 border border-slate-800/80 bg-[#0f1629]/95 flex flex-col justify-between group cursor-pointer tap-scale-subtle focus-within:ring-2 focus-within:ring-sky-500"
             role="button"
             tabindex="0"
             aria-label="${unit.name}, ${unit.star}★, ${translateTowerType(unit.tower_type)}. ${t('card_click_inspect', 'Cliquer pour inspecter.')}"
             onclick="openUnitModal('${unit.id}')"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openUnitModal('${unit.id}');}">

      <!-- Top Badges -->
      <div class="flex items-center justify-between z-10 mb-2">
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono-num font-bold star-${unit.star}-badge shadow-sm">
            ${unit.star}★
          </span>
          ${unit._is_community_new ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="${t('badge_community_title', 'Création communautaire')}">${t('badge_community', 'Communauté')}</span>` : ''}
          ${unit._is_community_modified ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide" title="${t('badge_modified_title', 'Statistiques modifiées')}">${t('badge_modified', 'Modifié')}</span>` : ''}
          ${isNewUnit(unit) && !unit._is_community_new ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide" title="${t('wiki_page_created_on', 'Fiche wiki créée le')} ${new Date(unit.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR')}">${t('badge_new', 'Nouveau')}</span>` : ''}
        </div>
        <div class="flex items-center space-x-1">
          ${unit.is_unobtainable ? `<span class="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 rounded" title="${t('filter_obtainable_title', 'Unité retirée du jeu')}">${t('badge_unobtainable', 'Introuvable')}</span>` : ''}
          ${unit.is_tradeable ? '<span class="px-1.5 py-0.2 text-[9px] font-semibold bg-slate-900 text-slate-300 border border-slate-800 rounded">Trade</span>' : ''}
          <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded" title="${towerTypeTooltip(unit.tower_type)}">${translateTowerType(unit.tower_type)}</span>
        </div>
      </div>

      <!-- Avatar Framed with concentric radius & neutral outline -->
      <div class="w-full h-32 rounded-lg bg-[#070b14] border border-slate-800/80 p-2 my-1 flex items-center justify-center relative overflow-hidden group-hover:border-sky-500/40 transition-colors duration-150">
        <img src="${imgSrc}" alt="" loading="lazy"
             onerror="this.src='${fallbackImg}'"
             class="max-h-full max-w-full object-contain filter drop-shadow img-outline rounded-md group-hover:scale-105 transition-transform duration-150 ease-out">
      </div>

      <!-- Title & Origin -->
      <div class="my-2 min-w-0">
        <div class="font-bold text-xs sm:text-sm text-white group-hover:text-sky-300 transition-colors duration-150 truncate text-balance" title="${unit.name}">
          ${unit.name}
        </div>
        <div class="text-[11px] text-slate-400 truncate text-pretty" title="${originLine}">
          ${originLine}
        </div>
      </div>

      <!-- Tactical Micro-Metrics Grid (Neutral, Readable, High Contrast WCAG AA) -->
      <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80 font-mono-num text-[11px]">
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('dmg_max_tooltip', "Dégâts au palier d'amélioration maximum")}">DMG</span>
          <span class="font-bold text-slate-100" title="${unit.max_damage.toLocaleString()}">${formatCompactNumber(unit.max_damage)}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('dps_max_tooltip', "Dégâts Par Seconde au palier maximum")}">DPS</span>
          <span class="font-bold text-amber-300" title="${unit.max_dps.toLocaleString()}">${formatCompactNumber(unit.max_dps)}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('range_max_tooltip', "Distance d'attaque maximale")}">${t('hud_range_short', 'Portée')}</span>
          <span class="font-semibold text-slate-200">${unit.max_range || '-'}</span>
        </div>
        <div class="bg-[#090e1c] px-2 py-1 rounded-md border border-slate-800/60 shadow-sm">
          <span class="text-slate-400 block text-[9px] font-sans uppercase" title="${t('spa_tooltip', "SPA : Secondes Par Attaque (délai entre deux attaques)")}">SPA</span>
          <span class="font-semibold text-slate-300">${unit.min_spa ? unit.min_spa + 's' : '-'}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-3 flex items-center space-x-1.5" onclick="event.stopPropagation()">
        <button onclick="openUnitModal('${unit.id}')" aria-label="${t('btn_card', 'Fiche')} : ${unit.name}" class="flex-1 ps-2.5 pe-3 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale flex items-center justify-center space-x-1 transition-colors">
          <i data-lucide="eye" class="w-3 h-3" stroke-width="2"></i>
          <span>${t('btn_card', 'Fiche')}</span>
        </button>
        <button onclick="startCompareWith('${unit.id}')" aria-label="${t('btn_compare_title', 'Comparer cette unité')} ${unit.name}" class="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale flex items-center justify-center transition-colors" title="${t('btn_compare_title', 'Comparer cette unité')}">
          <i data-lucide="arrow-left-right" class="w-3 h-3" stroke-width="2"></i>
        </button>
        <button onclick="addUnitToTeam('${unit.id}')" aria-label="${t('btn_add_deck_title', 'Ajouter au deck')} ${unit.name}" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-bold text-slate-300 tap-scale flex items-center justify-center transition-colors" title="${t('btn_add_deck_title', 'Ajouter au deck')}">
          +
        </button>
      </div>

    </article>
  `;
}

// Highlight numeric stats, multipliers and percentages in text for readability
function highlightStats(text) {
  if (!text) return '';
  return text
    .replace(/(\b\d+(?:\.\d+)?x\b)/gi, '<strong class="text-rose-400 font-mono-num font-bold">$1</strong>')
    .replace(/(\b\d+(?:\.\d+)?%\b)/g, '<strong class="text-amber-400 font-mono-num font-bold">$1</strong>')
    .replace(/(\b\d+(?:\.\d+)?\s*(?:billion|million|B|M|k)\s*(?:damage|HP|cash)?\b)/gi, '<strong class="text-sky-300 font-mono-num font-semibold">$1</strong>')
    .replace(/(\b\d+\s*(?:secondes?|seconds?|minutes?|min|sec)\b)/gi, '<strong class="text-emerald-400 font-mono-num font-semibold">$1</strong>');
}

function scrollToAbilitiesSection() {
  const el = document.getElementById('modal-abilities-section');
  if (!el) return;
  // Un-collapse first so the target card is actually visible after scrolling
  const content = document.getElementById('modal-abilities-content');
  if (content && content.classList.contains('hidden')) toggleAbilities();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toggle the special abilities / passives block on the unit modal
function toggleAbilities() {
  const section = document.getElementById('modal-abilities-section');
  const content = document.getElementById('modal-abilities-content');
  const label = document.getElementById('modal-abilities-btn-label');
  const chevron = document.getElementById('modal-abilities-chevron');
  if (!content) return;
  const nowHidden = content.classList.toggle('hidden');
  const btn = section ? section.querySelector('button') : null;
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
  if (label) label.textContent = nowHidden ? t('btn_show', 'Afficher') : t('btn_hide', 'Masquer');
  if (chevron) chevron.classList.toggle('rotate-180', !nowHidden);
}

// Render the dedicated Special Abilities, Passives & Leader section in the unit modal
function renderModalAbilities(unit) {
  const section = document.getElementById('modal-abilities-section');
  const list = document.getElementById('modal-abilities-list');
  const countBadge = document.getElementById('modal-abilities-count');
  if (!section || !list) return;

  const abilities = unit.abilities || [];
  if (abilities.length === 0) {
    section.classList.add('hidden');
    list.innerHTML = '';
    return;
  }

  section.classList.remove('hidden');
  if (countBadge) countBadge.textContent = abilities.length;

  // Reset to collapsed state each time the modal opens
  const content = document.getElementById('modal-abilities-content');
  const btn = section.querySelector('button');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (content) {
    content.classList.add('hidden');
    const label = document.getElementById('modal-abilities-btn-label');
    if (label) label.textContent = t('btn_show', 'Afficher');
    const chevron = document.getElementById('modal-abilities-chevron');
    if (chevron) chevron.classList.remove('rotate-180');
  }

  const typeConfig = {
    manual: {
      label: t('ability_manual', 'Aptitude Manuelle'),
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: 'flame',
      iconColor: 'text-rose-400',
      cardBorder: 'border-rose-900/40 hover:border-rose-500/40'
    },
    passive: {
      label: t('ability_passive', 'Passif Spécial'),
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: 'shield',
      iconColor: 'text-purple-400',
      cardBorder: 'border-purple-900/40 hover:border-purple-500/40'
    },
    leader: {
      label: t('ability_leader', 'Leader'),
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: 'crown',
      iconColor: 'text-amber-400',
      cardBorder: 'border-amber-900/40 hover:border-amber-500/40'
    }
  };

  list.innerHTML = abilities.map((ab, idx) => {
    const cfg = typeConfig[ab.type] || {
      label: t('ability_default', 'Capacité'),
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: 'sparkles',
      iconColor: 'text-sky-400',
      cardBorder: 'border-slate-800 hover:border-slate-700'
    };

    const descLines = (translateAbilityDescription(ab.description) || '').split('\n').filter(l => l.trim().length > 0);
    const formattedDesc = descLines.map(line => {
      const l = line.trim();
      if (l.startsWith('•')) {
        return `<div class="flex items-start gap-1.5 mt-1 text-slate-200"><i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i><span>${highlightStats(l.substring(1).trim())}</span></div>`;
      }
      return `<p class="leading-relaxed">${highlightStats(l)}</p>`;
    }).join('');

    const localizedName = translateAbilityName(ab.name);
    const localizedUnlock = translateUnlock(ab.unlock);

    return `
      <div id="ability-card-${idx}" class="bg-slate-950/80 border ${cfg.cardBorder} rounded-xl p-3.5 flex flex-col sm:flex-row gap-3.5 transition-colors">
        <!-- Ability Icon or Fallback -->
        <div class="shrink-0 flex sm:flex-col items-center justify-center">
          <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden p-1 shadow-md">
            ${ab.icon_url ? `
              <img src="${ab.icon_url}" alt="${localizedName}" class="max-w-full max-h-full object-contain img-outline rounded-lg"
                   onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
              <i data-lucide="${cfg.icon}" class="w-6 h-6 ${cfg.iconColor} hidden"></i>
            ` : `
              <i data-lucide="${cfg.icon}" class="w-6 h-6 ${cfg.iconColor}"></i>
            `}
          </div>
        </div>

        <!-- Ability Content -->
        <div class="flex-1 min-w-0 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-bold text-white text-sm sm:text-base tracking-tight">${localizedName}</h4>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${cfg.badgeClass}">
                ${cfg.label}
              </span>
            </div>
            ${localizedUnlock ? `
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-semibold bg-slate-900 border border-slate-700 text-sky-300 flex items-center gap-1.5 shadow-sm">
                <i data-lucide="unlock" class="w-3 h-3 text-sky-400"></i>
                <span>${localizedUnlock}</span>
              </span>
            ` : ''}
          </div>

          <div class="text-xs text-slate-300 font-sans bg-slate-900/70 rounded-lg p-2.5 border border-slate-800/80 space-y-1">
            ${formattedDesc}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// UNIT DETAIL MODAL (TACTICAL HUD)
// ==========================================

function openUnitModal(unitId) {
  const unit = ALL_UNITS.find(u => u.id === unitId || u.name.toLowerCase() === unitId.toLowerCase());
  if (!unit) return;

  // Save active element to restore focus on modal close
  lastFocusedElement = document.activeElement;

  currentModalUnit = unit;
  window.location.hash = `unit/${unit.id}`;

  const modal = document.getElementById('unit-modal');
  const nameEl = document.getElementById('modal-unit-name');
  const starBadge = document.getElementById('modal-star-badge');
  const imgEl = document.getElementById('modal-unit-image');
  const imgWrapper = document.getElementById('modal-img-wrapper');
  const tradeBadge = document.getElementById('modal-trade-badge');
  const animeEl = document.getElementById('modal-anime-origin');
  const overviewEl = document.getElementById('modal-overview-text');
  const fandomLink = document.getElementById('modal-fandom-link');

  // Stats elements
  const towerTypeEl = document.getElementById('modal-tower-type');
  const attackTypeEl = document.getElementById('modal-attack-type');
  towerTypeEl.textContent = translateTowerType(unit.tower_type);
  towerTypeEl.title = towerTypeTooltip(unit.tower_type);
  attackTypeEl.textContent = translateAttackType(unit.attack_type);
  attackTypeEl.title = t('attack_type_tooltip', "AoE : Area of Effect (zone touchée par chaque attaque : cercle, cône, ligne...)");
  document.getElementById('modal-deploy-cost').textContent = unit.deployment_cost ? `$${unit.deployment_cost.toLocaleString()}` : t('unknown', 'Inconnu');
  document.getElementById('modal-total-cost').textContent = unit.total_cost ? `$${unit.total_cost.toLocaleString()}` : t('unknown', 'Inconnu');
  // max damage / dps per card level -> renderModalHeaderStats()

  // Details
  nameEl.textContent = unit.name;
  starBadge.textContent = `${unit.star}★`;
  starBadge.className = `px-2 py-0.5 rounded text-xs font-black star-${unit.star}-badge`;
  
  imgEl.src = unit.image || "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  imgWrapper.className = `w-44 h-44 rounded-xl bg-[#070b14] border border-slate-800/80 p-2 overflow-hidden flex items-center justify-center shadow relative`;

  tradeBadge.classList.toggle('hidden', !unit.is_tradeable);
  const unobtainableBadge = document.getElementById('modal-unobtainable-badge');
  if (unobtainableBadge) unobtainableBadge.classList.toggle('hidden', !unit.is_unobtainable);

  // Reset the card-level toggle to Level 1 on each modal open
  setLevelView(1);

  // Case « Buff Idol » : visible pour toute unité qui n'est pas elle-même
  // la donneuse (Idol affiche déjà ses % dans la colonne Buff de son tableau)
  const provider = findBuffProvider();
  const buffToggleWrap = document.getElementById('idol-buff-toggle-wrap');
  if (buffToggleWrap) {
    const isProvider = provider && unit.id === provider.id;
    idolBuffToggleHidden = isProvider;
    idolBuffEnabled = false;
    const cb = document.getElementById('idol-buff-toggle');
    if (cb) cb.checked = false;
    updateIdolBuffToggleUI();
    updateIdolBuffNote();
  }

  // Origin: anime/franchise + character when both are known
  const animePart = unit.anime_origin ? `${t('anime_prefix', 'Anime :')} ${unit.anime_origin}` : null;
  const charPart = unit.character_origin ? `${t('char_prefix', 'Personnage :')} ${unit.character_origin}` : null;
  animeEl.textContent = [animePart, charPart].filter(Boolean).join('  •  ') || t('origin_all_star', 'Origine : Personnage All Star');

  // Date d'ajout au wiki (création de la fiche) sous le portrait
  const addedEl = document.getElementById('modal-added-date');
  if (addedEl) {
    if (unit.created_at) {
      const d = new Date(unit.created_at);
      addedEl.textContent = `${t('added_on', 'Ajoutée le')} ${d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR')}`;
      addedEl.title = t('added_on_tooltip', "Fiche wiki créée le {date} — le badge Nouveau s'affiche pendant 30 jours").replace('{date}', d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR'));
      addedEl.classList.remove('hidden');
    } else {
      addedEl.classList.add('hidden');
    }
  }

  overviewEl.textContent = translateOverview(stripWikiMarkup(unit.overview), unit) || t('no_overview', "Aucune description détaillée enregistrée pour cette unité.");

  // Obtention : source racine derrière une évolution (raid, story, bannière...)
  const obtainBox = document.getElementById('modal-obtain-source');
  const obtainText = document.getElementById('modal-obtain-source-text');
  const obtainChain = document.getElementById('modal-obtain-chain');
  if (obtainBox && obtainText) {
    // source résolue depuis la chaîne d'évolution, sinon phrase directe du wiki
    const source = unit.obtain_source || (unit.obtain && !/evolv/i.test(unit.obtain) ? unit.obtain : null);
    if (source) {
      obtainText.textContent = translateObtain(stripWikiMarkup(source));
      if (obtainChain) {
        if (unit.obtain_chain && unit.obtain_chain.length > 0) {
          obtainChain.textContent = `${t('evolution_of', 'Évolution de :')} ${unit.obtain_chain.join(' → ')}`;
        } else if (unit.evolution && unit.evolution.evolves_into) {
          obtainChain.textContent = `${t('can_evolve_into', 'Peut évoluer en')} ${unit.evolution.evolves_into}`;
        } else {
          obtainChain.textContent = '';
        }
      }
      obtainBox.classList.remove('hidden');
    } else {
      obtainText.textContent = '';
      if (obtainChain) obtainChain.textContent = '';
      obtainBox.classList.add('hidden');
    }
  }

  if (fandomLink) {
    fandomLink.href = `https://allstartd.fandom.com/wiki/${encodeURIComponent(unit.name)}`;
  }

  // Visual Damage Progression Range (re-rendered per level in renderModalHeaderStats)
  renderModalHeaderStats();

  // Render Evolution Section
  const evoSection = document.getElementById('modal-evolution-section');
  const evoContent = document.getElementById('modal-evolution-content');
  if (unit.evolution && unit.evolution.evolves_into) {
    evoSection.classList.remove('hidden');
    const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
    const targetName = (unit.evolution.evolves_into || '').trim();
    const targetLower = targetName.toLowerCase();
    const evoTargetUnit = ALL_UNITS.find(u =>
      u.name.toLowerCase() === targetLower ||
      u.id.toLowerCase() === targetLower.replace(/\s+/g, '_')
    );

    let targetHTML = '';
    if (evoTargetUnit) {
      targetHTML = `
        <div class="flex items-center gap-2 mb-2.5 flex-wrap">
          <span class="text-xs text-slate-400">${t('evolves_into', 'Évolue en :')}</span>
          <button onclick="openUnitModal('${evoTargetUnit.id}')"
                  title="Voir la fiche de ${evoTargetUnit.name}"
                  class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 hover:border-amber-400 hover:bg-slate-800 tap-scale transition-colors shadow-sm group">
            <span class="w-7 h-7 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="${evoTargetUnit.image || fallbackImg}" class="max-h-full max-w-full object-contain img-outline rounded" alt="" onerror="this.src='${fallbackImg}'">
            </span>
            <span class="text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">${evoTargetUnit.name}</span>
            <span class="inline-block text-[10px] font-mono-num font-bold star-${evoTargetUnit.star}-badge px-1 rounded">${evoTargetUnit.star}★</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400/60 group-hover:text-amber-300 shrink-0" stroke-width="2"></i>
          </button>
        </div>
      `;
    } else {
      targetHTML = `
        <div class="text-xs mb-2">${t('evolves_into', 'Évolue en :')} <strong class="text-amber-400 font-bold">${targetName}</strong></div>
      `;
    }

    let materialsHTML = '';
    if (unit.evolution.materials && unit.evolution.materials.length > 0) {
      materialsHTML = `
        <div>
          <div class="text-[11px] font-medium text-slate-400 mb-1.5">${t('required_materials', 'Matériaux requis :')}</div>
          <div class="flex flex-wrap gap-2">
            ${unit.evolution.materials.map(m => {
              const mName = (m.name || '').trim().replace(/\u200e/g, '');
              const mLower = mName.toLowerCase();
              const matUnit = ALL_UNITS.find(u =>
                u.name.toLowerCase() === mLower ||
                u.id.toLowerCase() === mLower.replace(/\s+/g, '_')
              );

              let imgSrc = m.image || (matUnit ? matUnit.image : '') || (MATERIAL_IMAGES && MATERIAL_IMAGES[mName]) || fallbackImg;

              let countDisplay = (m.count || '').trim();
              if (countDisplay && !countDisplay.startsWith('x') && !countDisplay.startsWith('×') && !countDisplay.endsWith('x')) {
                countDisplay = `x${countDisplay}`;
              }

              if (matUnit) {
                return `
                  <button onclick="openUnitModal('${matUnit.id}')"
                          title="Voir la fiche de ${matUnit.name}"
                          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/90 hover:border-sky-500/60 hover:bg-slate-800 tap-scale transition-colors shadow-sm group text-left">
                    <span class="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src="${imgSrc}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${mName}" onerror="this.src='${fallbackImg}'">
                    </span>
                    <span class="min-w-0 pr-0.5">
                      <span class="block text-xs font-semibold text-slate-200 group-hover:text-white truncate max-w-[130px] sm:max-w-[160px]">${mName}</span>
                      <span class="flex items-center gap-1.5 mt-0.5">
                        <span class="inline-block text-[9px] font-mono-num font-bold star-${matUnit.star}-badge px-1 rounded leading-none py-0.5">${matUnit.star}★</span>
                        <strong class="text-xs font-bold text-sky-400 font-mono-num">${countDisplay}</strong>
                      </span>
                    </span>
                  </button>
                `;
              } else {
                const rarityLabel = m.rarity && m.rarity !== 'new' ? `${m.rarity}★` : 'Item';
                return `
                  <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/70 shadow-sm text-left">
                    <span class="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src="${imgSrc}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${mName}" onerror="this.src='${fallbackImg}'">
                    </span>
                    <span class="min-w-0 pr-0.5">
                      <span class="block text-xs font-semibold text-slate-200 truncate max-w-[130px] sm:max-w-[160px]">${mName}</span>
                      <span class="flex items-center gap-1.5 mt-0.5">
                        <span class="inline-block text-[9px] font-mono-num font-semibold text-slate-400 bg-slate-800 border border-slate-700/60 px-1 rounded leading-none py-0.5">${rarityLabel}</span>
                        <strong class="text-xs font-bold text-sky-400 font-mono-num">${countDisplay}</strong>
                      </span>
                    </span>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>
      `;
    }
    evoContent.innerHTML = `
      ${targetHTML}
      ${materialsHTML}
    `;
  } else {
    evoSection.classList.add('hidden');
  }

  // Pre-evolutions (units that evolve INTO this one) — collapsed by default
  const preevoSection = document.getElementById('modal-preevo-section');
  const preevoContent = document.getElementById('modal-preevo-content');
  if (preevoSection && preevoContent) {
    const target = unit.name.toLowerCase();
    const preEvos = ALL_UNITS.filter(u =>
      u.evolution && u.evolution.evolves_into &&
      u.evolution.evolves_into.toLowerCase() === target
    );
    if (preEvos.length > 0) {
      preevoSection.classList.remove('hidden');
      // Reset to collapsed state each time the modal opens
      preevoContent.classList.add('hidden');
      const preevoBtn = preevoSection.querySelector('button');
      if (preevoBtn) preevoBtn.setAttribute('aria-expanded', 'false');
      const preevoLabel = document.getElementById('modal-preevo-btn-label');
      if (preevoLabel) preevoLabel.textContent = t('btn_show', 'Afficher');
      document.getElementById('modal-preevo-chevron').classList.remove('rotate-180');
      document.getElementById('modal-preevo-count').textContent = `(${preEvos.length})`;
      const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
      const preevoHeading = currentLang === 'en' ? `Unit${preEvos.length > 1 ? 's' : ''} evolving into` : `Unité${preEvos.length > 1 ? 's' : ''} qui évolue${preEvos.length > 1 ? 'nt' : ''} en`;
      preevoContent.innerHTML = `
        <div class="text-xs text-slate-400 mb-2">
          ${preevoHeading}
          <strong class="text-amber-400">${unit.name}</strong> :
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${preEvos.map(p => `
            <button onclick="openUnitModal('${p.id}')"
                    class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-800 tap-scale transition-colors shadow-sm">
              <span class="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="${p.image || fallbackImg}" class="max-h-full max-w-full object-contain img-outline rounded" alt="" onerror="this.src='${fallbackImg}'">
              </span>
              <span class="text-left min-w-0">
                <span class="block text-[11px] font-bold text-white truncate max-w-[150px]" title="${p.name}">${p.name}</span>
                <span class="inline-block text-[10px] font-mono-num font-bold star-${p.star}-badge px-1 rounded mt-0.5">${p.star}★</span>
              </span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500 shrink-0" stroke-width="2"></i>
            </button>
          `).join('')}
        </div>
      `;
    } else {
      preevoSection.classList.add('hidden');
    }
  }

  // Render Abilities Section
  renderModalAbilities(unit);

  // Render Community Tips
  if (window.CommunityManager) {
    CommunityManager.renderUnitCommunityTips(unit.id);
  }

  // Upgrades table & level toggle state are (re)rendered by setLevelView(1) above

  // Set inert on background elements to trap focus within modal dialog
  const headerEl = document.getElementById('app-header');
  const mainEl = document.getElementById('main-content');
  const footerEl = document.querySelector('footer');
  if (headerEl) headerEl.setAttribute('inert', '');
  if (mainEl) mainEl.setAttribute('inert', '');
  if (footerEl) footerEl.setAttribute('inert', '');

  const dialog = document.getElementById('unit-modal-dialog');
  modal.classList.remove('hidden', 'closing');
  if (dialog) {
    dialog.classList.remove('modal-exit');
    dialog.classList.add('modal-enter');
  }
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();

  // Send keyboard focus to the modal close button
  requestAnimationFrame(() => {
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.focus();
  });
}

// Switch the upgrade table between Level 1 and Level 175 card stats
function setLevelView(level) {
  if (level !== 1 && level !== 175) return;
  currentLevelView = level;

  const btn1 = document.getElementById('btn-level-1');
  const btn175 = document.getElementById('btn-level-175');
  const activeCls = 'bg-sky-600 text-white border-sky-500';
  const idleCls = 'bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-500/50 hover:text-sky-300';
  if (btn1) {
    btn1.className = `px-2.5 py-1 rounded-lg text-[11px] font-bold border tap-scale transition-colors flex items-center gap-1 shadow-sm ${level === 1 ? activeCls : idleCls}`;
    btn1.setAttribute('aria-pressed', level === 1 ? 'true' : 'false');
  }
  if (btn175) {
    btn175.className = `px-2.5 py-1 rounded-lg text-[11px] font-bold border tap-scale transition-colors flex items-center gap-1 shadow-sm ${level === 175 ? activeCls : idleCls}`;
    btn175.setAttribute('aria-pressed', level === 175 ? 'true' : 'false');
  }

  const note = document.getElementById('modal-level-note');
  if (note) note.classList.toggle('hidden', level !== 175);
  updateIdolBuffToggleUI();
  updateIdolBuffNote();

  renderModalHeaderStats();
  renderUpgradesTable();
  if (window.lucide) lucide.createIcons();
}

// Rebuild the upgrades table for currentModalUnit at the selected card level
function renderModalHeaderStats() {
  const unit = currentModalUnit;
  if (!unit) return;
  const at175 = currentLevelView === 175;
  const mult = (at175 ? LEVEL_175.damage : 1) * idolBuffMultiplier();

  const baseDmg = unit.upgrades && unit.upgrades.length > 0 ? (unit.upgrades[0].damage || 0) : 0;
  const maxDmg = (unit.max_damage || baseDmg) * mult;
  const maxDps = (unit.max_dps || 0) * mult;

  const maxDmgEl = document.getElementById('modal-max-damage');
  if (maxDmgEl) {
    maxDmgEl.textContent = maxDmg ? Math.round(maxDmg).toLocaleString() : (unit.raw_damage || '0');
    const tags = [];
    if (at175) tags.push(t('tag_lvl175', 'niveau de carte 175'));
    if (idolBuffEnabled) tags.push(t('tag_idol', 'buff Idol +{pct}%').replace('{pct}', buffProviderPercent() || 0));
    maxDmgEl.title = tags.length ? `${t('dmg_max_tooltip', "Dégâts au palier d'amélioration maximum")}, ${tags.join(', ')}` : t('dmg_max_tooltip', "Dégâts au palier d'amélioration maximum");
  }
  const maxDpsEl = document.getElementById('modal-max-dps');
  if (maxDpsEl) {
    maxDpsEl.textContent = maxDps ? Math.round(maxDps).toLocaleString() : '-';
    const tags = [];
    if (at175) tags.push(t('tag_lvl175', 'niveau de carte 175'));
    if (idolBuffEnabled) tags.push(t('tag_idol', 'buff Idol +{pct}%').replace('{pct}', buffProviderPercent() || 0));
    maxDpsEl.title = tags.length ? `${t('dps_max_tooltip', "DPS Max Estimé au palier maximum")}, ${tags.join(', ')}` : t('dps_max_tooltip', "DPS Max Estimé au palier maximum");
  }
  const dmgLabel = document.getElementById('modal-dmg-range-label');
  if (dmgLabel) {
    const extra = (at175 ? ' • Lvl 175' : '') + (idolBuffEnabled ? ` • ${t('buff_idol_label', 'Buff Idol')}` : '');
    dmgLabel.textContent = `${Math.round(baseDmg * mult).toLocaleString()} DMG (Base)  →  ${Math.round(maxDmg).toLocaleString()} DMG (Max)${extra}`;
  }
}

// Rebuild the upgrades table for currentModalUnit at the selected card level
function renderUpgradesTable() {
  const unit = currentModalUnit;
  const tbody = document.getElementById('modal-upgrades-tbody');
  if (!unit || !tbody) return;

  const at175 = currentLevelView === 175;
  const r1 = x => Math.round(x * 10) / 10; // le wiki affiche jusqu'à 2 décimales (ex. 856.8)
  const buffMult = idolBuffMultiplier();
  const statAt = {
    damage: d => (d ? r1(d * (at175 ? LEVEL_175.damage : 1) * buffMult) : d),
    range: r => (at175 && r ? r1(r * LEVEL_175.range) : r),
    spa: s => (at175 && s ? r1(s * LEVEL_175.spa) : s),
  };

  // Colonne « Buff » : uniquement pour les unités qui fournissent un % de buff
  const showBuffCol = unitHasDamageBuff(unit);
  const buffTh = document.getElementById('upg-buff-th');
  if (buffTh) buffTh.classList.toggle('hidden', !showBuffCol);

  if (unit.upgrades && unit.upgrades.length > 0) {
    tbody.innerHTML = unit.upgrades.map((upg, idx) => {
      const abilities = (upg.abilities && upg.abilities.length > 0) ? upg.abilities : [];
      const abilitiesText = abilities.map(a => translateUpgradeEffect(stripWikiMarkup(a))).join(' • ') || '-';
      const hasAbilities = abilities.length > 0;

      // Check if this upgrade unlocks or references any known ability in unit.abilities
      const matchedAbilities = (unit.abilities && unit.abilities.length > 0) ? unit.abilities.filter(ab => {
        const abLower = ab.name.toLowerCase();
        return abilities.some(aStr => {
          const s = aStr.toLowerCase();
          return s.includes(abLower) || (ab.unlock && s.includes(ab.unlock.toLowerCase()));
        });
      }) : [];
      const hasMatched = matchedAbilities.length > 0;

      const dmg = statAt.damage(upg.damage || 0);
      const rng = statAt.range(upg.range || 0);
      const spa = statAt.spa(upg.spa || 0);
      const dps = (dmg && spa > 0) ? r1(dmg / spa) : 0;

      // % de buff de dégâts offert par CE palier, selon le niveau de carte affiché
      let buffCell = '';
      if (showBuffCol) {
        const lo = upg.buff_damage_low;
        const hi = upg.buff_damage_high;
        if (lo != null || hi != null) {
          const shown = at175 ? (hi ?? lo) : (lo ?? hi);
          const other = at175 ? (lo ?? hi) : (hi ?? lo);
          const tooltip = t('upg_buff_tooltip', 'Buff de dégâts fourni aux unités à portée (aptitude Shine) — {lvl}')
            .replace('{lvl}', at175 ? t('lvl_175_card', 'niveau de carte 175') : t('lvl_1_card', 'niveau de carte 1'));
          buffCell = `<td class="p-2.5 font-bold text-sky-300 font-mono-num" title="${tooltip}">+${shown}%${other && other !== shown ? ` <span class="text-[10px] text-slate-500 font-mono-num">(${at175 ? 'L1: ' : 'L175: '}+${other}%)</span>` : ''}</td>`;
        } else {
          buffCell = `<td class="p-2.5 text-slate-600 font-mono-num" title="${t('upg_buff_none', 'Aucun buff à ce palier (Your Star remplace Shine)')}">—</td>`;
        }
      }

      // Type change badge detection for this upgrade tier
      let typeBadge = '';
      const uTowerType = (upg.tower_type || '').toLowerCase();
      const hasHybrid = uTowerType === 'hybrid' || abilities.some(a => (a || '').toLowerCase().includes('hybrid'));
      const hasHill = uTowerType === 'hill' || abilities.some(a => (a || '').toLowerCase().includes('hill'));
      const hasAir = uTowerType === 'air' || abilities.some(a => (a || '').toLowerCase().includes('air'));
      const hasGround = uTowerType === 'ground';

      if (idx > 0) {
        if (hasHybrid) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-500/40 text-[10px] font-bold shrink-0">⚡ ${t('comm_type_hybrid_badge', 'Hybride')}</span>`;
        } else if (hasHill) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0">🏔️ ${t('comm_type_hill_badge', 'Colline')}</span>`;
        } else if (hasAir) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/25 text-sky-300 border border-sky-500/40 text-[10px] font-bold shrink-0">🦅 ${t('comm_type_air_badge', 'Aérien')}</span>`;
        } else if (hasGround) {
          typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold shrink-0">🌱 ${t('comm_type_ground_badge', 'Sol')}</span>`;
        }
      }

      return `
        <tr class="hover:bg-slate-800/40 transition ${(hasAbilities || hasMatched) ? 'cursor-pointer' : ''}"
            ${(hasAbilities || hasMatched) ? `onclick="toggleUpgradeAbility(${idx})" title="${t('click_read_ability', 'Cliquer pour lire les effets et détails de capacité')}"` : ''}>
          <td class="p-2.5 font-bold text-slate-200 font-mono-num">${upg.level !== undefined ? upg.level : idx}</td>
          <td class="p-2.5 font-semibold text-slate-300 font-mono-num">$${(upg.cost || 0).toLocaleString()}</td>
          <td class="p-2.5 font-bold text-slate-100 font-mono-num">${dmg.toLocaleString()}</td>
          <td class="p-2.5 text-slate-300 font-mono-num">${rng}</td>
          <td class="p-2.5 text-slate-400 font-mono-num">${spa}s</td>
          <td class="p-2.5 font-bold text-amber-300 font-mono-num">${dps.toLocaleString()}</td>
          ${buffCell}
          <td class="p-2.5 text-slate-400 font-sans text-[11px]">
            <div class="flex items-center gap-1.5 min-w-0">
              ${typeBadge}
              ${hasMatched ? `
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold shrink-0">
                  <i data-lucide="${matchedAbilities[0].type === 'manual' ? 'flame' : 'shield'}" class="w-2.5 h-2.5"></i>
                  <span>${translateAbilityName(matchedAbilities[0].name)}</span>
                </span>
              ` : ''}
              <span class="truncate flex-1 text-slate-300">${abilitiesText}</span>
              ${(hasAbilities || hasMatched) ? `<i data-lucide="maximize-2" id="ability-icon-${idx}" class="w-3 h-3 text-sky-400 shrink-0 transition-transform"></i>` : ''}
            </div>
          </td>
        </tr>
        ${(hasAbilities || hasMatched) ? `
        <tr id="ability-detail-${idx}" class="hidden">
          <td colspan="${showBuffCol ? 8 : 7}" class="px-3 py-3 bg-slate-900/90 border-l-2 border-sky-500/60">
            <div class="font-sans space-y-2">
              <div class="text-[10px] uppercase tracking-wider text-sky-400 font-bold flex items-center justify-between gap-1">
                <span class="flex items-center gap-1">
                  <i data-lucide="sparkles" class="w-3 h-3"></i>
                  ${t('upgrade_effects_prefix', 'Effets du palier')} ${upg.level !== undefined ? upg.level : idx}
                </span>
                ${hasMatched ? `
                  <button onclick="event.stopPropagation(); scrollToAbilitiesSection()" class="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-semibold normal-case">
                    <i data-lucide="arrow-up-circle" class="w-3 h-3"></i>
                    <span>${t('view_full_ability', "Voir la fiche complète de l'aptitude")}</span>
                  </button>
                ` : ''}
              </div>
              <ul class="space-y-1.5">
                ${abilities.map(a => `
                  <li class="text-[12px] text-slate-200 leading-relaxed flex gap-2">
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
                    <span>${translateUpgradeEffect(stripWikiMarkup(a))}</span>
                  </li>
                `).join('')}
              </ul>
              ${matchedAbilities.map(ma => `
                <div class="mt-2.5 p-3 rounded-lg bg-slate-950/90 border border-amber-500/30 space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${ma.type === 'manual' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40'}">
                      ${ma.type === 'manual' ? t('ability_manual', 'Aptitude Manuelle') : t('ability_passive', 'Passif')}
                    </span>
                    <strong class="text-white text-xs">${translateAbilityName(ma.name)}</strong>
                    ${ma.unlock ? `<span class="text-[10px] text-slate-400 font-mono-num">(${translateUnlock(ma.unlock)})</span>` : ''}
                  </div>
                  <div class="text-[11px] text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    ${highlightStats(translateAbilityDescription(ma.description))}
                  </div>
                </div>
              `).join('')}
            </div>
          </td>
        </tr>` : ''}
      `;
    }).join('');
  } else {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-4 text-center text-slate-500 font-sans">
          ${t('upgrades_empty', 'Statistiques de paliers détaillées non documentées pour cette unité.')}
        </td>
      </tr>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function closeUnitModal() {
  currentModalUnit = null;
  const modal = document.getElementById('unit-modal');
  const dialog = document.getElementById('unit-modal-dialog');
  if (!modal || modal.classList.contains('hidden')) return;

  // Remove inert on background elements
  const headerEl = document.getElementById('app-header');
  const mainEl = document.getElementById('main-content');
  const footerEl = document.querySelector('footer');
  if (headerEl) headerEl.removeAttribute('inert');
  if (mainEl) mainEl.removeAttribute('inert');
  if (footerEl) footerEl.removeAttribute('inert');

  const onClosed = () => {
    currentModalUnit = null;
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (window.location.hash.startsWith('#unit/')) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + currentTab);
      } else {
        window.location.hash = currentTab;
      }
    }
    // Restore focus to trigger element
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      try {
        lastFocusedElement.focus();
      } catch (e) {
        // Element might be detached
      }
      lastFocusedElement = null;
    }
  };

  if (dialog) {
    dialog.classList.remove('modal-enter');
    dialog.classList.add('modal-exit');
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('closing');
      dialog.classList.remove('modal-exit');
      onClosed();
    }, 150);
  } else {
    modal.classList.add('hidden');
    onClosed();
  }
}

// Toggle the expanded (large text) ability panel under an upgrade row
function toggleUpgradeAbility(idx) {
  const detailRow = document.getElementById(`ability-detail-${idx}`);
  const icon = document.getElementById(`ability-icon-${idx}`);
  if (!detailRow) return;
  const nowHidden = detailRow.classList.toggle('hidden');
  if (icon) {
    icon.classList.toggle('rotate-90', !nowHidden);
    icon.classList.toggle('text-amber-400', !nowHidden);
    icon.classList.toggle('text-sky-400', nowHidden);
  }
  if (window.lucide) lucide.createIcons();
}

// // Toggle the pre-evolutions block on the unit modal
function togglePreEvos() {
  const section = document.getElementById('modal-preevo-section');
  const content = document.getElementById('modal-preevo-content');
  const label = document.getElementById('modal-preevo-btn-label');
  const chevron = document.getElementById('modal-preevo-chevron');
  if (!content) return;
  const nowHidden = content.classList.toggle('hidden');
  const btn = section ? section.querySelector('button') : null;
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
  if (label) label.textContent = nowHidden ? t('btn_show', 'Afficher') : t('btn_hide', 'Masquer');
  if (chevron) chevron.classList.toggle('rotate-180', !nowHidden);
}

// ==========================================
// TIER LIST
// ==========================================

// Miniature 150px : Fandom sert une version webp ~6 Ko (au lieu de ~30 Ko pour le 300px)
function tierThumbUrl(unit) {
  const img = unit && unit.image;
  if (!img) return null;
  if (img.includes('/scale-to-width-down/')) {
    return img.replace(/\/scale-to-width-down\/\d+/, '/scale-to-width-down/150');
  }
  if (img.includes('/revision/')) {
    return img.replace('/revision/latest', '/revision/latest/scale-to-width-down/150')
              .replace('/revision/latest?', '/revision/latest/scale-to-width-down/150?');
  }
  return img;
}

function renderTierList() {
  const container = document.getElementById('tierlist-container');
  if (!container) return;

  const categories = Object.keys(TIERLIST_DATA);
  if (categories.length === 0) {
    container.innerHTML = `<div class="text-slate-400 text-xs">${t('tierlist_loading', 'Tier list en cours de chargement...')}</div>`;
    return;
  }

  container.innerHTML = categories.map(catName => {
    const unitNames = TIERLIST_DATA[catName] || [];
    const unitWord = currentLang === 'en' ? (unitNames.length > 1 ? 'units' : 'unit') : (unitNames.length > 1 ? 'unités' : 'unité');

    return `
      <div class="tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center space-x-2.5">
            <span class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border bg-sky-950/40 border-sky-500/40 text-sky-300">
              ${catName}
            </span>
            <span class="text-xs text-slate-500 font-mono-num font-semibold">${unitNames.length} ${unitWord}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2.5">
          ${unitNames.map(name => {
            const unitMatch = ALL_UNITS.find(u => u.name.toLowerCase() === name.toLowerCase());
            if (!unitMatch) {
              return `
                <button onclick="openUnitByName('${name.replace(/'/g, "\\'")}')"
                        class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs font-bold text-white flex items-center space-x-1.5 tap-scale transition-colors">
                  <span>${name}</span>
                  <i data-lucide="external-link" class="w-3 h-3 text-slate-500" stroke-width="1.75"></i>
                </button>
              `;
            }
            const star = unitMatch.star || 6;
            const thumb = tierThumbUrl(unitMatch);
            if (!thumb) {
              return `
                <button onclick="openUnitModal('${unitMatch.id}')"
                        class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-xs font-bold text-white flex items-center space-x-1.5 tap-scale transition-colors">
                  <span class="text-[10px] font-mono-num px-1 rounded star-${star}-badge">${star}★</span>
                  <span>${name}</span>
                  <i data-lucide="chevron-right" class="w-3 h-3 text-slate-500" stroke-width="2"></i>
                </button>
              `;
            }
            return `
              <button onclick="openUnitModal('${unitMatch.id}')"
                      class="w-[92px] rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-1.5 flex flex-col items-center gap-1 group tap-scale transition-colors">
                <div class="w-full h-[76px] rounded-lg bg-[#070b14] border border-slate-800/80 flex items-center justify-center overflow-hidden">
                  <img src="${thumb}" alt="${name}" loading="lazy"
                       onerror="this.onerror=null;this.closest('div').classList.add('tier-img-fallback');this.style.display='none'"
                       class="max-h-full max-w-full object-contain img-outline rounded group-hover:scale-105 transition-transform duration-150 ease-out">
                </div>
                <span class="text-[9px] font-mono-num font-bold px-1 rounded star-${star}-badge">${star}★</span>
                <span class="text-[10px] font-bold text-white leading-tight text-center line-clamp-2 w-full" title="${name}">${name}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openUnitByName(name) {
  const unit = ALL_UNITS.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (unit) {
    openUnitModal(unit.id);
  } else {
    showToast(currentLang === 'en' ? `Unit ${name} opened` : `Unité ${name} consultée`);
    window.open(`https://allstartd.fandom.com/wiki/${encodeURIComponent(name)}`, '_blank');
  }
}

// ==========================================
// CODES
// ==========================================

// Date du format wiki "23.06.2026" en timestamp ; 0 si absente/invalide
function codeTimestamp(c) {
  const m = (c.date || '').match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]).getTime() : 0;
}

function renderCodes() {
  const activeGrid = document.getElementById('active-codes-grid');
  const expiredCount = document.getElementById('expired-codes-count');
  const expiredList = document.getElementById('expired-codes-list');

  if (expiredCount) expiredCount.textContent = CODES_DATA.expired.length;

  if (activeGrid) {
    activeGrid.innerHTML = CODES_DATA.active.map(c => `
      <div class="tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 flex flex-col justify-between space-y-3 hover:border-sky-500/40 transition-colors duration-150">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                ${t('code_verified_active', 'Vérifié & Actif')}
              </span>
              ${c._is_community ? `<span class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">${t('badge_community', 'Communauté')}</span>` : ''}
            </div>
            <span class="text-[11px] text-slate-400 font-mono-num">${c.date || t('code_recent', 'Récent')}</span>
          </div>
          <div class="font-mono-num text-base font-bold text-white tracking-wide my-2 select-all bg-[#090e1c] px-3 py-2 rounded-lg border border-slate-800">
            ${c.code}
          </div>
          <div class="text-xs text-slate-300 bg-[#090e1c]/70 p-2.5 rounded-lg border border-slate-800/80">
            <strong class="text-amber-300 font-sans">${t('code_rewards_label', 'Récompenses :')}</strong> ${translateReward(c.reward)}
          </div>
        </div>
        <div class="flex items-center gap-1.5 w-full">
          <button onclick="copyCodeText('${c.code}', this)" aria-label="${t('btn_copy_code', 'Copier le code')} ${c.code}" class="flex-1 ps-3 pe-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-wide tap-scale flex items-center justify-center space-x-1.5 shadow-sm transition-colors">
            <i data-lucide="copy" class="w-3.5 h-3.5 text-white" stroke-width="2.5"></i>
            <span>${t('btn_copy_code', 'Copier le code')}</span>
          </button>
          <button onclick="CommunityManager.toggleCodeExpired('${c.code}')" aria-label="${t('btn_mark_expired', 'Signaler comme expiré')}" class="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-400 font-semibold text-xs tap-scale transition-colors shrink-0" title="${t('btn_mark_expired_title', 'Signaler ce code comme expiré')}">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5" stroke-width="2"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  if (expiredList) {
    renderExpiredCodesList(CODES_DATA.expired);
  }

  if (window.lucide) lucide.createIcons();
}

function renderExpiredCodesList(list) {
  const expiredList = document.getElementById('expired-codes-list');
  if (!expiredList) return;
  if (list.length === 0) {
    expiredList.innerHTML = `<span class="text-xs text-slate-400 italic py-1">${t('no_expired_codes', 'Aucun code expiré ne correspond à cette recherche.')}</span>`;
    return;
  }
  expiredList.innerHTML = list.slice(0, 100).map(c => `
    <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono-num text-slate-500 line-through">
      ${c.code}
    </span>
  `).join('');
}

function filterExpiredCodes() {
  const query = (document.getElementById('search-expired-codes')?.value || '').toLowerCase().trim();
  const filtered = CODES_DATA.expired.filter(c => c.code.toLowerCase().includes(query));
  renderExpiredCodesList(filtered);
}

function toggleExpiredCodes() {
  const wrapper = document.getElementById('expired-codes-wrapper');
  const arrow = document.getElementById('expired-arrow');
  const btn = document.getElementById('toggle-expired-btn');
  if (!wrapper) return;
  const nowHidden = wrapper.classList.toggle('hidden');
  if (arrow) arrow.classList.toggle('rotate-180', !nowHidden);
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
}

function copyLatestCode() {
  if (CODES_DATA.active && CODES_DATA.active.length > 0) {
    copyCodeText(CODES_DATA.active[0].code);
  }
}

function copyCodeText(text, btnElement) {
  const btn = btnElement || (window.event && window.event.currentTarget);
  const doFeedback = () => {
    showToast(t('toast_code_copied', 'Code "{code}" copié !').replace('{code}', text));
    if (btn) {
      const origHTML = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-slate-950" stroke-width="2.5"></i><span>${t('copied', 'Copié !')}</span>`;
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = origHTML;
        if (window.lucide) lucide.createIcons();
      }, 1800);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(doFeedback).catch(() => {
      fallbackCopyText(text);
      doFeedback();
    });
  } else {
    fallbackCopyText(text);
    doFeedback();
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ==========================================
// ORBS COMPENDIUM
// ==========================================

function renderOrbCard(o) {
  const fallback = 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png';
  const isUniversal = /toutes les unit|all units/i.test(o.require || '');
  const requireText = isUniversal ? t('all_units_badge', '★ Toutes les unités') : o.require;
  const requireTitle = isUniversal ? t('universal_orb_title', 'Équipable par toutes les unités') : t('restricted_orb_title', 'Réservé à cette unité (ou sa famille)');
  const isCommunity = !!(o._is_community || o._is_community_new || o._is_community_modified);
  const encodedName = encodeURIComponent(o.name || '');

  return `
    <div class="tactical-card rounded-xl p-4 border border-slate-800/80 bg-[#0f1629]/95 flex flex-col justify-between space-y-3 hover:border-sky-500/40 tap-scale-subtle transition-colors">
      <div>
        <div class="flex items-center space-x-3 mb-2.5">
          <div class="w-10 h-10 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center shrink-0">
            <img src="${o.image || fallback}" alt="${o.name}" class="max-h-full max-w-full object-contain img-outline rounded"
                 onerror="this.src='${fallback}'">
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <h4 class="font-bold text-xs text-white truncate">${o.name}</h4>
            </div>
            <span class="text-[10px] font-semibold ${isUniversal ? 'text-sky-300' : 'text-slate-400'}"
                  title="${requireTitle}">
              ${requireText}
            </span>
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80">
            <strong class="text-amber-300 block text-[10px] uppercase font-sans">${t('stat_bonus_label', 'Bonus statistique :')}</strong>
            <span class="text-slate-100 font-medium font-mono-num text-[11px]">${translateOrbEffect(o.effect) || t('special_bonus', 'Bonus spécial')}</span>
          </div>
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">${t('obtain_label', 'Obtention :')}</strong> ${translateObtain(o.obtain) || 'Trial / Raid'}
          </div>
          ${!isUniversal ? `
          <div class="text-[11px] text-slate-400">
            <strong class="text-slate-300 font-sans">${t('compatible_label', 'Compatible :')}</strong> <span class="text-sky-300">${o.require}</span>
          </div>` : ''}
        </div>
      </div>

      <div class="flex items-center justify-end pt-2 border-t border-slate-800/80 text-[11px]">
        <button onclick="if(window.CommunityUI) CommunityUI.openOrbModalForEdit(decodeURIComponent('${encodedName}'))" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-300 font-semibold text-xs tap-scale flex items-center gap-1.5 transition-colors" title="${t('comm_btn_edit_orb_title', 'Modifier cet orbe')}">
          <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>${t('comm_action_edit', 'Éditer')}</span>
        </button>
      </div>
    </div>
  `;
}

function renderOrbs() {
  const grid = document.getElementById('orbs-grid');
  if (!grid) return;
  grid.innerHTML = ORBS_DATA.map(renderOrbCard).join('');
  if (window.lucide) lucide.createIcons();
}

function filterOrbs() {
  const query = (document.getElementById('search-orbs')?.value || '').toLowerCase().trim();
  const grid = document.getElementById('orbs-grid');
  if (!grid) return;

  const filtered = ORBS_DATA.filter(o =>
    o.name.toLowerCase().includes(query) ||
    (o.effect || '').toLowerCase().includes(query) ||
    (o.require || '').toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-10 px-4 text-center text-slate-300 tactical-card rounded-2xl border border-slate-800 max-w-md mx-auto">
        <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-cyan-400">
          <i data-lucide="search-x" class="w-6 h-6" stroke-width="2"></i>
        </div>
        <h3 class="text-sm font-bold text-white text-balance">${t('no_orbs_found', 'Aucun orbe trouvé')}</h3>
        <p class="text-xs text-slate-400 mt-1 text-pretty">
          ${t('no_orbs_query', 'Aucun orbe ne correspond à la recherche « {q} ».').replace('{q}', `<strong class="text-white">${query}</strong>`)}
        </p>
        <button onclick="const el=document.getElementById('search-orbs'); if(el){el.value=''; filterOrbs();}" class="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold tap-scale inline-flex items-center gap-1.5 shadow-md">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5" stroke-width="2"></i>
          <span>${t('clear_search', 'Effacer la recherche')}</span>
        </button>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(renderOrbCard).join('');
  }
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// GAME MODES & RAIDS
// ==========================================

function renderGameModes() {
  const grid = document.getElementById('gamemodes-grid');
  if (!grid) return;

  grid.innerHTML = GAMEMODES_DATA.map(mode => {
    const name = currentLang === 'en' ? (mode.name_en || mode.name) : (mode.name_fr || mode.name);
    const type = currentLang === 'en' ? (mode.type_en || mode.type) : (mode.type_fr || mode.type);
    const desc = currentLang === 'en' ? (mode.description_en || mode.description) : (mode.description_fr || mode.description);
    const rewards = translateReward(currentLang === 'en' ? (mode.rewards_en || mode.rewards) : (mode.rewards_fr || mode.rewards));

    return `
      <div class="tactical-card rounded-xl p-5 border border-slate-800/80 bg-[#0f1629]/95 space-y-3 hover:border-sky-500/40 transition-colors tap-scale-subtle">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="swords" class="w-4 h-4 text-sky-400" stroke-width="2"></i>
            <span>${name}</span>
          </h3>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            ${type}
          </span>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          ${desc}
        </p>

        <div class="bg-[#090e1c] p-3 rounded-lg border border-slate-800/80 text-[11px]">
          <strong class="text-amber-300 font-semibold">${t('mode_rewards_label', 'Récompenses :')}</strong> ${rewards}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// TEAM BUILDER (6 SLOTS)
// ==========================================

function renderTeamBuilder() {
  const slotsContainer = document.getElementById('team-slots-container');
  if (!slotsContainer) return;

  const removeLabelTpl = t('remove_from_deck');
  const depLabel = t('dep_short');
  const slotEmptySrTpl = t('slot_empty_sr');
  const slotLabelTpl = t('slot_label');
  const addTowerLabel = t('add_a_tower');

  slotsContainer.innerHTML = teamSlots.map((unit, idx) => {
    if (unit) {
      const removeTitle = removeLabelTpl.replace('{name}', unit.name);
      return `
        <div class="tactical-card rounded-xl p-3 border border-slate-800/80 bg-[#0f1629]/95 relative flex flex-col items-center text-center group tap-scale-subtle">
          <button onclick="removeUnitFromTeam(${idx})" aria-label="${removeTitle}" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center tap-scale transition-colors shadow-sm" title="${removeTitle}">
            <i data-lucide="x" class="w-3.5 h-3.5" stroke-width="2.5"></i>
          </button>
          <div class="w-16 h-16 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center my-1 overflow-hidden">
            <img src="${unit.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${unit.name}">
          </div>
          <div class="font-bold text-xs text-white truncate w-full" title="${unit.name}">
            ${unit.name}
          </div>
          <span class="text-[10px] text-amber-300 font-mono-num font-bold">${unit.star}★ • ${translateTowerType(unit.tower_type || 'Ground')}</span>
          <div class="text-[10px] text-slate-300 font-mono-num font-semibold mt-0.5">
            ${depLabel}: $${(unit.deployment_cost || 0).toLocaleString()}
          </div>
        </div>
      `;
    } else {
      const slotEmptyAria = slotEmptySrTpl.replace('{n}', idx + 1);
      const slotText = slotLabelTpl.replace('{n}', idx + 1);
      return `
        <button type="button" onclick="focusTeamSearch()" aria-label="${slotEmptyAria}" class="border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 h-36 hover:border-sky-500/50 hover:text-sky-400 tap-scale transition-colors cursor-pointer group w-full text-center bg-[#090e1c]/40">
          <i data-lucide="plus-circle" class="w-6 h-6 mb-1.5 text-slate-500 group-hover:text-sky-400 transition-colors" stroke-width="2"></i>
          <span class="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">${slotText}</span>
          <span class="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">${addTowerLabel}</span>
        </button>
      `;
    }
  }).join('');

  updateTeamStats();
  renderTeamPicker();
  if (window.lucide) lucide.createIcons();
}

function updateTeamStats() {
  const activeUnits = teamSlots.filter(u => u !== null);
  
  let totalDeploy = 0;
  let totalMax = 0;
  let totalDps = 0;

  activeUnits.forEach(u => {
    totalDeploy += (u.deployment_cost || 0);
    totalMax += (u.total_cost || 0);
    totalDps += (u.max_dps || 0);
  });

  const deployEl = document.getElementById('team-stat-deploy');
  const totalEl = document.getElementById('team-stat-total');
  const dpsEl = document.getElementById('team-stat-dps');

  if (deployEl) deployEl.textContent = `$${totalDeploy.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `$${totalMax.toLocaleString()}`;
  if (dpsEl) dpsEl.textContent = totalDps.toLocaleString();

  const hasGround = activeUnits.some(u => (u.tower_type || '').toLowerCase().includes('ground'));
  const hasAir = activeUnits.some(u => (u.tower_type || '').toLowerCase().includes('air') || (u.tower_type || '').toLowerCase().includes('hybrid'));
  const hasMoney = activeUnits.some(u => ['jeff', 'octo', 'bulma', 'speedwagon', 'escanor', 'money'].some(k => u.name.toLowerCase().includes(k)));
  const hasSlowOrSupport = activeUnits.some(u => ['bb', 'blackbeard', 'idol', 'support', 'slow', 'freeze', 'time'].some(k => u.name.toLowerCase().includes(k) || (u.overview || '').toLowerCase().includes(k)));

  const checklistEl = document.getElementById('team-checklist');
  if (checklistEl) {
    checklistEl.innerHTML = `
      <div class="p-2.5 rounded-xl ${hasGround ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasGround ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">${t('team_anti_ground')}</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasAir ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasAir ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">${t('team_anti_air')}</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasMoney ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasMoney ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">${t('team_economy')}</span>
      </div>
      <div class="p-2.5 rounded-xl ${hasSlowOrSupport ? 'bg-sky-950/40 border border-sky-500/40 text-sky-300' : 'bg-slate-900 border border-slate-800 text-slate-500'} flex items-center space-x-2">
        <i data-lucide="${hasSlowOrSupport ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5" stroke-width="2"></i>
        <span class="font-medium">${t('team_support')}</span>
      </div>
    `;
  }
}

function renderTeamPicker() {
  const query = (document.getElementById('team-search-input')?.value || '').toLowerCase().trim();
  const pickerGrid = document.getElementById('team-picker-grid');
  if (!pickerGrid) return;

  const filtered = ALL_UNITS.filter(u => {
    if (!query) return u.star >= 6;
    return u.name.toLowerCase().includes(query) || (u.anime_origin || '').toLowerCase().includes(query);
  }).slice(0, 18);

  const btnAddLabel = t('btn_add');
  pickerGrid.innerHTML = filtered.map(u => `
    <div class="tactical-card p-2.5 rounded-xl border border-slate-800/80 bg-[#0f1629]/95 text-center flex flex-col items-center justify-between group">
      <div class="w-12 h-12 rounded-lg bg-[#070b14] border border-slate-800/80 p-1 flex items-center justify-center my-1 overflow-hidden">
        <img src="${u.image || 'https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png'}" class="max-h-full max-w-full object-contain img-outline rounded" alt="${u.name}">
      </div>
      <div class="text-[11px] font-bold text-white truncate w-full" title="${u.name}">${u.name}</div>
      <span class="text-[10px] star-${u.star}-badge px-1.5 py-0.5 rounded my-1 font-mono-num font-bold">${u.star}★</span>
      <button onclick="addUnitToTeam('${u.id}')" aria-label="${t('modal_btn_deck_aria')} (${u.name})" class="w-full py-1 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-[10px] font-bold tap-scale transition-colors shadow-sm">
        ${btnAddLabel}
      </button>
    </div>
  `).join('');
}

function focusTeamSearch() {
  document.getElementById('team-search-input')?.focus();
}

function addUnitToTeam(unitId) {
  const unit = ALL_UNITS.find(u => u.id === unitId);
  if (!unit) return;

  const emptyIndex = teamSlots.findIndex(s => s === null);
  if (emptyIndex === -1) {
    showToast(t('toast_team_full'));
    return;
  }

  if (teamSlots.some(s => s && s.id === unit.id)) {
    showToast(t('toast_already_in_team').replace('{name}', unit.name));
    return;
  }

  teamSlots[emptyIndex] = unit;
  showToast(t('toast_added_to_team').replace('{name}', unit.name).replace('{slot}', emptyIndex + 1));
  renderTeamBuilder();
}

function addCurrentModalUnitToTeam() {
  if (currentModalUnit) {
    addUnitToTeam(currentModalUnit.id);
  }
}

function removeUnitFromTeam(index) {
  if (teamSlots[index]) {
    const name = teamSlots[index].name;
    teamSlots[index] = null;
    showToast(t('toast_removed_from_team').replace('{name}', name));
    renderTeamBuilder();
  }
}

function clearTeam() {
  teamSlots = [null, null, null, null, null, null];
  showToast(t('toast_team_cleared'));
  renderTeamBuilder();
}

// ==========================================
// COMPARATEUR DE PERSONNAGES (TACTICAL VERSUS)
// ==========================================

let compareUnitA = null;
let compareUnitB = null;
let compareLevelView = 1; // 1 | 175
let compareIdolBuff = false;

function getCompareIdolMaxPercent() {
  const p = findBuffProvider();
  let maxBuff = 250;
  if (p && p.upgrades) {
    p.upgrades.forEach(up => {
      if (up.buff_damage_high != null) maxBuff = Math.max(maxBuff, up.buff_damage_high);
      if (up.buff_damage_low != null) maxBuff = Math.max(maxBuff, up.buff_damage_low);
    });
  }
  return maxBuff || 250;
}

function setCompareLevel(lvl) {
  if (lvl !== 1 && lvl !== 175) return;
  compareLevelView = lvl;
  const btn1 = document.getElementById('btn-compare-lvl-1');
  const btn175 = document.getElementById('btn-compare-lvl-175');
  if (btn1) {
    btn1.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors shadow-sm ${lvl === 1 ? 'bg-sky-600 text-white border border-sky-500' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-sky-500/50 hover:text-white'}`;
    btn1.setAttribute('aria-pressed', lvl === 1 ? 'true' : 'false');
  }
  if (btn175) {
    btn175.className = `px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${lvl === 175 ? 'bg-sky-600 text-white border border-sky-500' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-sky-500/50 hover:text-white'}`;
    btn175.setAttribute('aria-pressed', lvl === 175 ? 'true' : 'false');
  }
  updateCompareIdolToggleUI();
  renderCompareView();
}

function updateCompareIdolToggleUI() {
  const pctEl = document.getElementById('compare-idol-pct');
  if (pctEl) {
    pctEl.textContent = `+${getCompareIdolMaxPercent()}%`;
  }
  const label = document.querySelector('label[for="compare-idol-buff-toggle"]');
  if (label) {
    label.classList.toggle('bg-sky-500/20', compareIdolBuff);
    label.classList.toggle('border-sky-500/50', compareIdolBuff);
    label.classList.toggle('text-sky-200', compareIdolBuff);
    label.classList.toggle('bg-[#090e1c]', !compareIdolBuff);
    label.classList.toggle('border-slate-800', !compareIdolBuff);
    label.classList.toggle('text-slate-300', !compareIdolBuff);
  }
}

function toggleCompareIdolBuff() {
  const cb = document.getElementById('compare-idol-buff-toggle');
  compareIdolBuff = cb ? cb.checked : !compareIdolBuff;
  updateCompareIdolToggleUI();
  renderCompareView();
}

function getCompareIdolMultiplier() {
  if (!compareIdolBuff) return 1;
  const pct = getCompareIdolMaxPercent();
  return 1 + pct / 100;
}

function setCompareUnit(slot, unitOrId) {
  let unit = null;
  if (typeof unitOrId === 'string') {
    unit = ALL_UNITS.find(u => u.id === unitOrId || u.name.toLowerCase() === unitOrId.toLowerCase()) || null;
  } else {
    unit = unitOrId;
  }

  if (slot === 'a') {
    compareUnitA = unit;
    const inputA = document.getElementById('compare-search-a');
    if (inputA) inputA.value = unit ? unit.name : '';
    const clearBtnA = document.getElementById('compare-clear-a');
    if (clearBtnA) clearBtnA.classList.toggle('hidden', !unit);
    hideCompareDropdown('a');
  } else if (slot === 'b') {
    compareUnitB = unit;
    const inputB = document.getElementById('compare-search-b');
    if (inputB) inputB.value = unit ? unit.name : '';
    const clearBtnB = document.getElementById('compare-clear-b');
    if (clearBtnB) clearBtnB.classList.toggle('hidden', !unit);
    hideCompareDropdown('b');
  }

  updateCompareUrl();
  renderCompareView();
}

function clearCompareSlot(slot) {
  setCompareUnit(slot, null);
}

function clearCompare() {
  compareUnitA = null;
  compareUnitB = null;
  const inputA = document.getElementById('compare-search-a');
  if (inputA) inputA.value = '';
  const inputB = document.getElementById('compare-search-b');
  if (inputB) inputB.value = '';
  const clearBtnA = document.getElementById('compare-clear-a');
  if (clearBtnA) clearBtnA.classList.add('hidden');
  const clearBtnB = document.getElementById('compare-clear-b');
  if (clearBtnB) clearBtnB.classList.add('hidden');
  updateCompareUrl();
  renderCompareView();
}

function swapCompareUnits() {
  const tmp = compareUnitA;
  compareUnitA = compareUnitB;
  compareUnitB = tmp;

  const inputA = document.getElementById('compare-search-a');
  if (inputA) inputA.value = compareUnitA ? compareUnitA.name : '';
  const inputB = document.getElementById('compare-search-b');
  if (inputB) inputB.value = compareUnitB ? compareUnitB.name : '';

  const clearBtnA = document.getElementById('compare-clear-a');
  if (clearBtnA) clearBtnA.classList.toggle('hidden', !compareUnitA);
  const clearBtnB = document.getElementById('compare-clear-b');
  if (clearBtnB) clearBtnB.classList.toggle('hidden', !compareUnitB);

  updateCompareUrl();
  renderCompareView();
}

function updateCompareUrl() {
  if (currentTab === 'compare') {
    if (compareUnitA && compareUnitB) {
      window.location.hash = `compare/${compareUnitA.id}/${compareUnitB.id}`;
    } else if (compareUnitA) {
      window.location.hash = `compare/${compareUnitA.id}`;
    } else {
      window.location.hash = 'compare';
    }
  }
}

function loadComparePreset(idA, idB) {
  const termA = idA.replace(/_/g, ' ').toLowerCase();
  const termB = idB.replace(/_/g, ' ').toLowerCase();
  const uA = ALL_UNITS.find(u => u.id === idA || u.id.toLowerCase() === idA.toLowerCase() || u.name.toLowerCase().includes(termA));
  const uB = ALL_UNITS.find(u => u.id === idB || u.id.toLowerCase() === idB.toLowerCase() || u.name.toLowerCase().includes(termB));
  if (uA) setCompareUnit('a', uA);
  if (uB) setCompareUnit('b', uB);
  switchTab('compare');
}

function startCompareWith(unitId) {
  const unit = ALL_UNITS.find(u => u.id === unitId || u.name.toLowerCase() === unitId.toLowerCase());
  if (!unit) return;

  if (!compareUnitA || compareUnitA.id === unit.id) {
    setCompareUnit('a', unit);
  } else if (!compareUnitB) {
    setCompareUnit('b', unit);
  } else {
    setCompareUnit('b', unit);
  }

  switchTab('compare');
  showToast(t('toast_added_to_compare').replace('{name}', unit.name));
}

function startCompareWithModalUnit() {
  if (currentModalUnit) {
    const id = currentModalUnit.id;
    closeUnitModal();
    startCompareWith(id);
  }
}

function handleCompareSearch(slot) {
  const input = document.getElementById(`compare-search-${slot}`);
  const dropdown = document.getElementById(`compare-dropdown-${slot}`);
  if (!input || !dropdown) return;

  if (!ALL_UNITS || ALL_UNITS.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center italic">${t('loading_units')}</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  const q = input.value.trim().toLowerCase();
  const otherUnit = slot === 'a' ? compareUnitB : compareUnitA;

  const matches = ALL_UNITS.filter(u => {
    if (otherUnit && u.id === otherUnit.id) return false;
    if (!q) return u.star >= 6;
    return u.name.toLowerCase().includes(q) || (u.anime_origin || '').toLowerCase().includes(q);
  }).slice(0, 10);

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center italic">${t('no_units_found')}</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  dropdown.innerHTML = matches.map(u => `
    <div onclick="setCompareUnit('${slot}', '${u.id}')"
         class="px-3 py-2 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between border-b border-slate-800/60 last:border-0 transition-colors"
         role="option" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setCompareUnit('${slot}','${u.id}');}">
      <div class="flex items-center space-x-2.5 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-[#070b14] border border-slate-800 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
          <img src="${u.image || fallbackImg}" alt="" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-white truncate">${u.name}</div>
          <div class="text-[10px] text-slate-400 truncate">${u.anime_origin || (currentLang === 'fr' ? 'Personnage All Star' : 'All Star Character')}</div>
        </div>
      </div>
      <div class="flex items-center space-x-1.5 shrink-0">
        <span class="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded star-${u.star}-badge">${u.star}★</span>
        <span class="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-1 rounded">${translateTowerType(u.tower_type || 'Ground')}</span>
      </div>
    </div>
  `).join('');

  dropdown.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function hideCompareDropdown(slot) {
  const dropdown = document.getElementById(`compare-dropdown-${slot}`);
  if (dropdown) dropdown.classList.add('hidden');
}

// Global click listener to close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#compare-search-a') && !e.target.closest('#compare-dropdown-a')) {
    hideCompareDropdown('a');
  }
  if (!e.target.closest('#compare-search-b') && !e.target.closest('#compare-dropdown-b')) {
    hideCompareDropdown('b');
  }
});

function getUnitCompareStats(unit, at175, withIdol) {
  if (!unit) return null;
  const mult = (at175 ? LEVEL_175.damage : 1) * (withIdol ? getCompareIdolMultiplier() : 1);
  const rangeMult = at175 ? LEVEL_175.range : 1;
  const spaMult = at175 ? LEVEL_175.spa : 1;

  const baseDmg = unit.upgrades && unit.upgrades.length > 0 ? (unit.upgrades[0].damage || 0) : 0;
  const maxDmg = Math.round((unit.max_damage || baseDmg) * mult);
  const maxRange = Math.round(((unit.max_range || 0) * rangeMult) * 10) / 10;
  const minSpa = Math.round(((unit.min_spa || 0) * spaMult) * 10) / 10;
  const maxDps = (unit.max_dps && unit.max_dps > 0) ? Math.round(unit.max_dps * mult) : ((maxDmg && minSpa > 0) ? Math.round(maxDmg / minSpa) : 0);
  const deployCost = unit.deployment_cost || 0;
  const totalCost = unit.total_cost || 0;
  const costPerDps = (totalCost > 0 && maxDps > 0) ? Math.round((totalCost / maxDps) * 10) / 10 : 0;
  const upgradeCount = unit.upgrades ? unit.upgrades.length : 0;

  return {
    unit,
    baseDmg: Math.round(baseDmg * mult),
    maxDmg,
    maxDps,
    maxRange,
    minSpa,
    deployCost,
    totalCost,
    costPerDps,
    upgradeCount
  };
}

function evalMetric(valA, valB, higherIsBetter) {
  if (valA === valB) {
    return { winner: 'tie', diffText: t('tie'), pctA: 50, pctB: 50, pctDiffText: '0%' };
  }
  const aWins = higherIsBetter ? valA > valB : valA < valB;
  const winner = aWins ? 'a' : 'b';

  let pctA = 50, pctB = 50;
  if (higherIsBetter) {
    const sum = valA + valB;
    if (sum > 0) {
      pctA = Math.round((valA / sum) * 100);
      pctB = 100 - pctA;
    }
  } else {
    const invA = 1 / (valA || 0.001);
    const invB = 1 / (valB || 0.001);
    const sumInv = invA + invB;
    if (sumInv > 0) {
      pctA = Math.round((invA / sumInv) * 100);
      pctB = 100 - pctA;
    }
  }

  const big = Math.max(valA, valB);
  const small = Math.min(valA, valB);
  const pctDiff = small > 0 ? Math.round(((big - small) / small) * 100) : 100;
  const diffVal = Math.abs(valA - valB);

  return {
    winner,
    pctA,
    pctB,
    diffText: `${aWins ? '+' : '-'}${formatCompactNumber(diffVal)}`,
    pctDiffText: `+${pctDiff}%`
  };
}

function generateTacticalVerdict(sA, sB) {
  const uA = sA.unit;
  const uB = sB.unit;

  const dpsEval = evalMetric(sA.maxDps, sB.maxDps, true);
  const spaEval = evalMetric(sA.minSpa, sB.minSpa, false);
  const rangeEval = evalMetric(sA.maxRange, sB.maxRange, true);
  const costEval = evalMetric(sA.costPerDps, sB.costPerDps, false);

  const tieText = t('tie');
  let dpsLeader = dpsEval.winner === 'a' ? uA.name : (dpsEval.winner === 'b' ? uB.name : tieText);
  let spaLeader = spaEval.winner === 'a' ? uA.name : (spaEval.winner === 'b' ? uB.name : tieText);
  let rangeLeader = rangeEval.winner === 'a' ? uA.name : (rangeEval.winner === 'b' ? uB.name : tieText);
  let costLeader = costEval.winner === 'a' ? uA.name : (costEval.winner === 'b' ? uB.name : tieText);

  let recommendation = "";
  if (currentLang === 'en') {
    if (dpsEval.winner === 'a') {
      recommendation = `<strong>${uA.name}</strong> stands out as the primary choice for late waves and <em>Infinite Mode</em> thanks to its massive DPS advantage (+${dpsEval.pctDiffText}).`;
      if (spaEval.winner === 'b' || costEval.winner === 'b') {
        recommendation += ` However, <strong>${uB.name}</strong> remains formidable in <em>Story / Early Game</em> thanks to higher attack rate or a more accessible initial cost.`;
      }
    } else if (dpsEval.winner === 'b') {
      recommendation = `<strong>${uB.name}</strong> widely dominates the matchup in raw damage (+${dpsEval.pctDiffText} DPS), ideal for <em>Infinite Mode</em>.`;
      if (spaEval.winner === 'a' || costEval.winner === 'a') {
        recommendation += ` <strong>${uA.name}</strong> compensates with better cost efficiency or faster attack rate in support.`;
      }
    } else {
      recommendation = `Both units feature equivalent DPS. The choice will come down to range (${rangeLeader}), placement type (${translateTowerType(uA.tower_type)} vs ${translateTowerType(uB.tower_type)}), and passive abilities.`;
    }
  } else {
    if (dpsEval.winner === 'a') {
      recommendation = `<strong>${uA.name}</strong> s'impose comme le choix prioritaire pour les vagues avancées et le <em>Mode Infini</em> grâce à son avantage massif de DPS (+${dpsEval.pctDiffText}).`;
      if (spaEval.winner === 'b' || costEval.winner === 'b') {
        recommendation += ` Cependant, <strong>${uB.name}</strong> reste redoutable en <em>Histoire / Début de partie</em> grâce à une cadence supérieure ou un investissement initial plus accessible.`;
      }
    } else if (dpsEval.winner === 'b') {
      recommendation = `<strong>${uB.name}</strong> domine largement le duel en puissance brute (+${dpsEval.pctDiffText} DPS), idéale pour le <em>Mode Infini</em>.`;
      if (spaEval.winner === 'a' || costEval.winner === 'a') {
        recommendation += ` <strong>${uA.name}</strong> compense avec une meilleure rentabilité ou cadence d'attaque en soutien.`;
      }
    } else {
      recommendation = `Les deux unités affichent un DPS équivalent. Le choix se fera sur la portée (${rangeLeader}), le type de placement (${translateTowerType(uA.tower_type)} vs ${translateTowerType(uB.tower_type)}) et leurs aptitudes passives.`;
    }
  }

  return `
    <div class="tactical-card p-4 rounded-xl border border-slate-800/80 bg-[#0a0f1d] space-y-3">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <div class="flex items-center gap-2">
          <i data-lucide="award" class="w-4 h-4 text-amber-300"></i>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">${t('verdict_title')}</h3>
        </div>
        <span class="text-[10px] text-slate-400 font-medium">${t('verdict_subtitle')}</span>
      </div>

      <!-- 4 pillars summary grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_dps')}</span>
          <span class="font-bold ${dpsEval.winner === 'a' ? 'text-sky-300' : (dpsEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${dpsLeader}">${dpsLeader}</span>
          <span class="text-[9px] text-slate-400">${dpsEval.pctDiffText} ${t('verdict_diff')}</span>
        </div>
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_spa')}</span>
          <span class="font-bold ${spaEval.winner === 'a' ? 'text-sky-300' : (spaEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${spaLeader}">${spaLeader}</span>
          <span class="text-[9px] text-slate-400">${spaEval.pctDiffText} ${t('verdict_faster')}</span>
        </div>
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_range')}</span>
          <span class="font-bold ${rangeEval.winner === 'a' ? 'text-sky-300' : (rangeEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${rangeLeader}">${rangeLeader}</span>
          <span class="text-[9px] text-slate-400">${rangeEval.pctDiffText} ${t('verdict_radius')}</span>
        </div>
        <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/60">
          <span class="text-[10px] text-slate-400 block font-semibold uppercase">${t('pillar_cost')}</span>
          <span class="font-bold ${costEval.winner === 'a' ? 'text-sky-300' : (costEval.winner === 'b' ? 'text-amber-300' : 'text-slate-200')} truncate block mt-0.5" title="${costLeader}">${costLeader}</span>
          <span class="text-[9px] text-slate-400">${t('verdict_ratio')}</span>
        </div>
      </div>

      <!-- Strategic recommendation paragraph -->
      <div class="text-xs text-slate-300 leading-relaxed bg-[#0f1629]/90 p-3 rounded-lg border border-slate-800/80">
        ${recommendation}
      </div>
    </div>
  `;
}

function renderCompareView() {
  const container = document.getElementById('compare-display-area');
  if (!container) return;

  const fallbackImg = "https://static.wikia.nocookie.net/allstartd/images/b/bc/Wiki.png";
  const at175 = compareLevelView === 175;
  const withIdol = compareIdolBuff;

  // Case 1: Empty state (0 or only 1 unit selected)
  if (!compareUnitA || !compareUnitB) {
    container.innerHTML = `
      <div class="tactical-card p-8 rounded-xl border border-slate-800/80 bg-[#0f1629]/95 text-center max-w-xl mx-auto space-y-4 my-6">
        <div class="w-14 h-14 rounded-2xl bg-[#090e1c] border border-slate-800 flex items-center justify-center mx-auto text-sky-400 shadow-md">
          <i data-lucide="arrow-left-right" class="w-7 h-7" stroke-width="2"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-white">${t('compare_empty_title')}</h3>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed text-pretty">
            ${t('compare_empty_desc')}
          </p>
        </div>

        <div class="pt-2 flex items-center justify-center gap-2">
          ${compareUnitA ? `
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070b14] border border-sky-500/40 text-xs">
              <span class="w-2 h-2 rounded-full bg-sky-400"></span>
              <span class="text-white font-bold">${compareUnitA.name}</span>
              <span class="text-sky-300 font-mono-num font-bold text-[10px]">${compareUnitA.star}★</span>
              <span class="text-slate-400 italic text-[11px]">${t('compare_choose_second')}</span>
            </div>
          ` : `
            <span class="text-xs text-slate-500 italic">${t('compare_no_unit')}</span>
          `}
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Case 2: Full comparison with both units selected
  const sA = getUnitCompareStats(compareUnitA, at175, withIdol);
  const sB = getUnitCompareStats(compareUnitB, at175, withIdol);

  // Stats evaluation
  const metrics = [
    { label: t('metric_dmg_max'), key: 'maxDmg', valA: sA.maxDmg, valB: sB.maxDmg, higherBetter: true, format: v => v.toLocaleString(), isDps: false },
    { label: t('metric_dps_max'), key: 'maxDps', valA: sA.maxDps, valB: sB.maxDps, higherBetter: true, format: v => v.toLocaleString(), isDps: true },
    { label: t('metric_range'), key: 'maxRange', valA: sA.maxRange, valB: sB.maxRange, higherBetter: true, format: v => v, isDps: false },
    { label: t('metric_spa'), key: 'minSpa', valA: sA.minSpa, valB: sB.minSpa, higherBetter: false, format: v => v + 's', isDps: false, note: t('note_spa') },
    { label: t('metric_deploy_cost'), key: 'deployCost', valA: sA.deployCost, valB: sB.deployCost, higherBetter: false, format: v => '$' + v.toLocaleString(), isDps: false, note: t('note_deploy') },
    { label: t('metric_total_cost'), key: 'totalCost', valA: sA.totalCost, valB: sB.totalCost, higherBetter: false, format: v => '$' + v.toLocaleString(), isDps: false, note: t('note_total') },
    { label: t('metric_cost_per_dps'), key: 'costPerDps', valA: sA.costPerDps, valB: sB.costPerDps, higherBetter: false, format: v => '$' + v, isDps: false, note: t('note_efficiency') },
    { label: t('metric_upgrades_count'), key: 'upgradeCount', valA: sA.upgradeCount, valB: sB.upgradeCount, higherBetter: false, format: v => `${v} ${t('tiers_word')}`, isDps: false, note: t('note_upgrades') }
  ];

  container.innerHTML = `
    <!-- 1. Versus Identity Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      
      <!-- Card A -->
      <div class="tactical-card p-4 rounded-xl border border-sky-500/40 bg-[#0f1629]/95 flex flex-col justify-between space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-16 h-16 rounded-lg bg-[#070b14] border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="${compareUnitA.image || fallbackImg}" alt="${compareUnitA.name}" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold star-${compareUnitA.star}-badge shadow-sm">${compareUnitA.star}★</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded">${translateTowerType(compareUnitA.tower_type || 'Ground')}</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 rounded">${translateAttackType(compareUnitA.attack_type || 'AoE')}</span>
              </div>
              <h3 class="font-bold text-sm sm:text-base text-white truncate mt-1 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-sky-400 shrink-0"></span>
                <span>${compareUnitA.name}</span>
              </h3>
              <p class="text-[11px] text-slate-400 truncate">${compareUnitA.anime_origin || (currentLang === 'fr' ? 'Personnage All Star' : 'All Star Character')}</p>
            </div>
          </div>
          <button onclick="openUnitModal('${compareUnitA.id}')" aria-label="${t('modal_btn_compare_aria')} (${compareUnitA.name})" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale transition-colors shrink-0">
            ${t('btn_card')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 font-mono-num text-[11px]">
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dps_max_a')}</span>
            <span class="font-bold text-sky-300 text-xs">${sA.maxDps.toLocaleString()}</span>
          </div>
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dmg_max_a')}</span>
            <span class="font-bold text-slate-100 text-xs">${sA.maxDmg.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Card B -->
      <div class="tactical-card p-4 rounded-xl border border-amber-500/40 bg-[#0f1629]/95 flex flex-col justify-between space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-16 h-16 rounded-lg bg-[#070b14] border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="${compareUnitB.image || fallbackImg}" alt="${compareUnitB.name}" class="max-h-full max-w-full object-contain img-outline rounded" onerror="this.src='${fallbackImg}'">
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold star-${compareUnitB.star}-badge shadow-sm">${compareUnitB.star}★</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 rounded">${translateTowerType(compareUnitB.tower_type || 'Ground')}</span>
                <span class="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 rounded">${translateAttackType(compareUnitB.attack_type || 'AoE')}</span>
              </div>
              <h3 class="font-bold text-sm sm:text-base text-white truncate mt-1 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                <span>${compareUnitB.name}</span>
              </h3>
              <p class="text-[11px] text-slate-400 truncate">${compareUnitB.anime_origin || (currentLang === 'fr' ? 'Personnage All Star' : 'All Star Character')}</p>
            </div>
          </div>
          <button onclick="openUnitModal('${compareUnitB.id}')" aria-label="${t('modal_btn_compare_aria')} (${compareUnitB.name})" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-600 hover:text-white border border-slate-800 text-[11px] font-semibold text-slate-300 tap-scale transition-colors shrink-0">
            ${t('btn_card')}
          </button>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 font-mono-num text-[11px]">
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dps_max_b')}</span>
            <span class="font-bold text-amber-300 text-xs">${sB.maxDps.toLocaleString()}</span>
          </div>
          <div class="bg-[#090e1c] px-2.5 py-1.5 rounded-md border border-slate-800/60">
            <span class="text-slate-400 block text-[9px] font-sans uppercase">${t('dmg_max_b')}</span>
            <span class="font-bold text-slate-100 text-xs">${sB.maxDmg.toLocaleString()}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 2. Tactical Verdict Banner -->
    ${generateTacticalVerdict(sA, sB)}

    <!-- 3. Direct Metrics Comparison Table with Gauges -->
    <div class="tactical-card rounded-xl border border-slate-800/80 bg-[#0f1629]/95 overflow-hidden">
      <div class="p-3.5 bg-[#141d33] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <i data-lucide="sliders-horizontal" class="w-4 h-4 text-sky-400"></i>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">${t('compare_table_title')}</h3>
        </div>
        <div class="flex items-center gap-2 text-[11px] font-mono-num flex-wrap">
          <span class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300 font-bold">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>A : ${compareUnitA.name}</span>
          </span>
          <span class="text-slate-500 font-sans">vs</span>
          <span class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>B : ${compareUnitB.name}</span>
          </span>
        </div>
      </div>

      <div class="divide-y divide-slate-800/70">
        ${metrics.map(m => {
          const ev = evalMetric(m.valA, m.valB, m.higherBetter);
          const isAWin = ev.winner === 'a';
          const isBWin = ev.winner === 'b';
          const winnerName = isAWin ? compareUnitA.name : compareUnitB.name;
          return `
            <div class="p-3.5 hover:bg-slate-800/30 transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span>${m.label}</span>
                  ${m.note ? `<span class="text-[10px] text-slate-400 font-normal font-sans">(${m.note})</span>` : ''}
                </span>
                
                <div class="flex items-center gap-2 text-xs font-mono-num flex-wrap">
                  <span class="px-2 py-0.5 rounded text-[11px] ${isAWin ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 shadow-sm' : 'text-slate-300 bg-slate-900/60 border border-slate-800'}">
                    <span class="text-[9px] text-sky-400/80 mr-1 font-sans font-semibold">A:</span>${m.format(m.valA)}
                  </span>
                  <span class="text-[10px] text-slate-500">vs</span>
                  <span class="px-2 py-0.5 rounded text-[11px] ${isBWin ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm' : 'text-slate-300 bg-slate-900/60 border border-slate-800'}">
                    <span class="text-[9px] text-amber-400/80 mr-1 font-sans font-semibold">B:</span>${m.format(m.valB)}
                  </span>
                  ${ev.winner !== 'tie' ? `
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isAWin ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                      ${isAWin ? 'A' : 'B'} +${ev.pctDiffText.replace('+', '')} (${winnerName})
                    </span>
                  ` : `
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      ${t('tie')}
                    </span>
                  `}
                </div>
              </div>

              <!-- Relative Gauge Bar -->
              <div class="space-y-1 mt-1.5">
                <div class="compare-gauge-track flex">
                  <div class="compare-gauge-fill-a" style="width: ${ev.pctA}%" title="${compareUnitA.name}: ${ev.pctA}%"></div>
                  <div class="compare-gauge-fill-b" style="width: ${ev.pctB}%" title="${compareUnitB.name}: ${ev.pctB}%"></div>
                </div>
                <div class="flex justify-between items-center text-[9px] font-mono-num text-slate-400">
                  <span class="${isAWin ? 'text-sky-300 font-bold' : ''}">A (${compareUnitA.name}) : ${ev.pctA}%</span>
                  <span class="${isBWin ? 'text-amber-300 font-bold' : ''}">B (${compareUnitB.name}) : ${ev.pctB}%</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 4. Special Abilities Comparison -->
    <div class="tactical-card p-4 rounded-xl border border-slate-800/80 bg-[#0f1629]/95 space-y-3">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="zap" class="w-4 h-4 text-amber-300"></i>
          <span>${t('compare_abilities_title')}</span>
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Abilities Unit A -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>${compareUnitA.name}</span>
            <span class="text-slate-500 font-normal">(${currentLang === 'fr' ? `${(compareUnitA.abilities || []).length} capacité${(compareUnitA.abilities || []).length > 1 ? 's' : ''}` : `${(compareUnitA.abilities || []).length} abilit${(compareUnitA.abilities || []).length > 1 ? 'ies' : 'y'}`})</span>
          </div>
          ${(compareUnitA.abilities && compareUnitA.abilities.length > 0) ? `
            <div class="space-y-2">
              ${compareUnitA.abilities.map(ab => `
                <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <strong class="text-white">${translateAbilityName(ab.name)}</strong>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300">${translateUnlock(ab.type) || (ab.type ? ab.type : (currentLang === 'fr' ? 'Capacité' : 'Ability'))}</span>
                  </div>
                  <p class="text-[11px] text-slate-300 leading-relaxed">${translateAbilityDescription(stripWikiMarkup(ab.description))}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-3 text-xs text-slate-500 italic bg-[#090e1c] rounded-lg border border-slate-800/60">
              ${t('no_abilities_documented')}
            </div>
          `}
        </div>

        <!-- Abilities Unit B -->
        <div class="space-y-2">
          <div class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>${compareUnitB.name}</span>
            <span class="text-slate-500 font-normal">(${currentLang === 'fr' ? `${(compareUnitB.abilities || []).length} capacité${(compareUnitB.abilities || []).length > 1 ? 's' : ''}` : `${(compareUnitB.abilities || []).length} abilit${(compareUnitB.abilities || []).length > 1 ? 'ies' : 'y'}`})</span>
          </div>
          ${(compareUnitB.abilities && compareUnitB.abilities.length > 0) ? `
            <div class="space-y-2">
              ${compareUnitB.abilities.map(ab => `
                <div class="bg-[#090e1c] p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <strong class="text-white">${translateAbilityName(ab.name)}</strong>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300">${translateUnlock(ab.type) || (ab.type ? ab.type : (currentLang === 'fr' ? 'Capacité' : 'Ability'))}</span>
                  </div>
                  <p class="text-[11px] text-slate-300 leading-relaxed">${translateAbilityDescription(stripWikiMarkup(ab.description))}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-3 text-xs text-slate-500 italic bg-[#090e1c] rounded-lg border border-slate-800/60">
              ${t('no_abilities_documented')}
            </div>
          `}
        </div>

      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('hidden', 'toast-animate-out');
  toast.classList.add('toast-animate-in');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast-animate-in');
    toast.classList.add('toast-animate-out');
    setTimeout(() => {
      if (toast.classList.contains('toast-animate-out')) {
        toast.classList.add('hidden');
        toast.classList.remove('toast-animate-out');
      }
    }, 150);
  }, 2200);

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// EXPOSITION GLOBALE EXPLICITE (WINDOW)
// ==========================================
// Garantit que toutes les fonctions appelées par des attributs inline HTML
// sont toujours accessibles sur window, quel que soit le contexte ou le mode de chargement.
if (typeof window !== 'undefined') {
  // Navigation & Vues
  window.switchTab = switchTab;
  window.updateNavActiveState = updateNavActiveState;
  window.toggleMobileMenu = toggleMobileMenu;
  window.switchTabAndCloseDrawer = switchTabAndCloseDrawer;
  window.setViewMode = setViewMode;
  window.setStarFilter = setStarFilter;
  window.clearAllFilters = clearAllFilters;
  window.sortTableBy = sortTableBy;
  window.loadMoreUnits = loadMoreUnits;

  // Modale Unité & Détails
  window.openUnitModal = openUnitModal;
  window.openUnitByName = openUnitByName;
  window.closeUnitModal = closeUnitModal;
  window.togglePreEvos = togglePreEvos;
  window.toggleAbilities = toggleAbilities;
  window.toggleUpgradeAbility = toggleUpgradeAbility;
  window.scrollToAbilitiesSection = scrollToAbilitiesSection;
  window.setLevelView = setLevelView;
  window.toggleIdolBuff = toggleIdolBuff;

  // Deck / Team Builder
  window.clearTeam = clearTeam;
  window.addUnitToTeam = addUnitToTeam;
  window.addCurrentModalUnitToTeam = addCurrentModalUnitToTeam;
  window.removeUnitFromTeam = removeUnitFromTeam;
  window.renderTeamPicker = renderTeamPicker;
  window.focusTeamSearch = focusTeamSearch;

  // Comparateur Tactique
  window.setCompareLevel = setCompareLevel;
  window.toggleCompareIdolBuff = toggleCompareIdolBuff;
  window.setCompareUnit = setCompareUnit;
  window.clearCompareSlot = clearCompareSlot;
  window.clearCompare = clearCompare;
  window.swapCompareUnits = swapCompareUnits;
  window.loadComparePreset = loadComparePreset;
  window.startCompareWith = startCompareWith;
  window.startCompareWithModalUnit = startCompareWithModalUnit;
  window.handleCompareSearch = handleCompareSearch;
  window.hideCompareDropdown = hideCompareDropdown;
  window.renderCompareView = renderCompareView;

  // Codes & Orbes & Utilitaires
  window.toggleExpiredCodes = toggleExpiredCodes;
  window.filterExpiredCodes = filterExpiredCodes;
  window.copyCodeText = copyCodeText;
  window.copyLatestCode = copyLatestCode;
  window.filterOrbs = filterOrbs;
  window.renderOrbs = renderOrbs;
  window.renderOrbCard = renderOrbCard;
  window.showToast = showToast;
  window.initSafeAds = initSafeAds;
  window.focusMainSearch = focusMainSearch;
  window.openAdsNoticeModal = openAdsNoticeModal;
  window.closeAdsNoticeModal = closeAdsNoticeModal;

  // I18N Bilingue (FR / EN)
  window.I18N = I18N;
  window.setLanguage = setLanguage;
  window.t = t;
  window.currentLang = currentLang;
  window.translateTowerType = translateTowerType;
  window.translateAttackType = translateAttackType;
  window.translateAbilityName = translateAbilityName;
  window.translateUnlock = translateUnlock;
  window.translateObtain = translateObtain;
  window.translateOverview = translateOverview;
  window.translateAbilityDescription = translateAbilityDescription;
  window.translateUpgradeEffect = translateUpgradeEffect;
  window.translateReward = translateReward;
  window.translateOrbEffect = translateOrbEffect;
}
