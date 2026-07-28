import type { Answers } from "./schemas";

export const LEGACY_ANSWER_LABELS: Record<string, Record<string, string>> = {
  "stuck-areas": {
    "Career / purpose": "career_purpose",
    "Body / health": "body_health",
    "Relationships / intimacy": "relationships_intimacy",
    "Money / receiving": "money_receiving",
    "Identity / sense of self": "identity_sense_of_self",
    "Creativity / expression": "creativity_expression",
    "Other": "other"
  },
  "family-role": {
    "The responsible one": "the_responsible_one",
    "The peacemaker": "the_peacemaker",
    "The caretaker": "the_caretaker",
    "The achiever / the proof": "the_achiever_the_proof",
    "The invisible one": "the_invisible_one",
    "The funny one / the relief": "the_funny_one_the_relief",
    "The strong one": "the_strong_one",
    "The problem": "the_problem",
    "Other": "other"
  },
  "childhood-truths": {
    "I tried not to be a burden": "i_tried_not_to_be_a_burden",
    "I tried not to add stress to anyone": "i_tried_not_to_add_stress_to_anyone",
    "I was the easy one / the good one": "i_was_the_easy_one_the_good_one",
    "I learned to read the room before I spoke": "i_learned_to_read_the_room_before_i_spoke",
    "I kept my problems to myself": "i_kept_my_problems_to_myself",
    "I felt responsible for someone else's wellbeing": "i_felt_responsible_for_someone_elses_wellbeing",
    "I felt I had to be okay so others could be okay": "i_felt_i_had_to_be_okay_so_others_could_be_okay",
    "I grew up faster than I needed to": "i_grew_up_faster_than_i_needed_to",
    "I didn't want to take up space": "i_didnt_want_to_take_up_space",
    "I performed being fine": "i_performed_being_fine",
    "Other": "other"
  },
  "home-climate": {
    "Tense / walking on eggshells": "tense_walking_on_eggshells",
    "Cold / disconnected": "cold_disconnected",
    "Chaotic / unpredictable": "chaotic_unpredictable",
    "Over-involved / enmeshed": "over_involved_enmeshed",
    "Performative / image-focused": "performative_image_focused",
    "Warm but conditional": "warm_but_conditional",
    "Other": "other"
  },
  "tracked-wellbeing": {
    "A parent's health (physical or mental)": "a_parents_health_physical_or_mental",
    "A parent's mood / emotions": "a_parents_mood_emotions",
    "A sibling who needed extra care or attention": "a_sibling_who_needed_extra_care_or_attention",
    "The family's image / reputation": "the_familys_image_reputation",
    "The peace of the home": "the_peace_of_the_home",
    "A financial situation": "a_financial_situation",
    "A grief / loss the family carried": "a_grief_loss_the_family_carried",
    "An unspoken tension no one talked about": "an_unspoken_tension_no_one_talked_about",
    "None that I'm aware of": "none_that_im_aware_of",
    "Other": "other"
  },
  "unspoken-rules": {
    "Don't make things harder": "dont_make_things_harder",
    "Don't be the reason someone worries": "dont_be_the_reason_someone_worries",
    "Stay small with your needs": "stay_small_with_your_needs",
    "Be the one who's okay": "be_the_one_whos_okay",
    "Achieve / succeed / make us proud": "achieve_succeed_make_us_proud",
    "Don't outshine": "dont_outshine",
    "Hold it together": "hold_it_together",
    "Be grateful, don't complain": "be_grateful_dont_complain",
    "Be useful": "be_useful",
    "Be good": "be_good",
    "Don't need too much": "dont_need_too_much",
    "Other": "other"
  },
  "childhood-movement": {
    "Always one step ahead / anticipating": "always_one_step_ahead_anticipating",
    "Quietly observing before acting": "quietly_observing_before_acting",
    "Tip-toeing / careful not to disturb": "tip_toeing_careful_not_to_disturb",
    "Performing okay-ness": "performing_okay_ness",
    "Caring for others before myself": "caring_for_others_before_myself",
    "Hyper-organized / hyper-responsible": "hyper_organized_hyper_responsible",
    "Gentle, not too much, not too loud": "gentle_not_too_much_not_too_loud",
    "Mature for my age": "mature_for_my_age",
    "The \"easy\" child": "the_easy_child",
    "Always moving to the next thing": "always_moving_to_the_next_thing",
    "Other": "other"
  },
  "hard-to-stop": {
    "Planning ahead / running scenarios": "planning_ahead_running_scenarios",
    "Mentally to-do listing": "mentally_to_do_listing",
    "Checking on people you love": "checking_on_people_you_love",
    "Producing / achieving / progressing": "producing_achieving_progressing",
    "Improving yourself": "improving_yourself",
    "Anticipating what could go wrong": "anticipating_what_could_go_wrong",
    "Tracking everyone's mood / needs": "tracking_everyones_mood_needs",
    "Optimizing your time": "optimizing_your_time",
    "Being useful": "being_useful",
    "Preparing": "preparing",
    "Tidying / organizing / arranging": "tidying_organizing_arranging",
    "Other": "other"
  },
  "slowing-fear": {
    "I'll fall behind / lose my edge": "ill_fall_behind_lose_my_edge",
    "Something bad will happen to someone I love": "something_bad_will_happen_to_someone_i_love",
    "I'll be seen as lazy / selfish / useless": "ill_be_seen_as_lazy_selfish_useless",
    "I'll lose myself / disappear": "ill_lose_myself_disappear",
    "I'll feel everything I've been outrunning": "ill_feel_everything_ive_been_outrunning",
    "I'll become a burden": "ill_become_a_burden",
    "I won't be loved the same way": "i_wont_be_loved_the_same_way",
    "I won't matter": "i_wont_matter",
    "I'll get sick": "ill_get_sick",
    "I don't know, but it feels unsafe": "i_dont_know_but_it_feels_unsafe",
    "Other": "other"
  },
  "shadow-clues": {
    "I feel a sharp envy when I see certain women, confident, loud, sensual, free": "i_feel_a_sharp_envy_when_i_see_certain_women_confident_loud_sensual_fr",
    "I am fascinated by women who seem to \"get away with\" things I never could": "i_am_fascinated_by_women_who_seem_to_get_away_with_things_i_never_coul",
    "I have a private fantasy version of myself I never let out": "i_have_a_private_fantasy_version_of_myself_i_never_let_out",
    "I sometimes catch myself thinking \"if only I were the kind of person who...\"": "i_sometimes_catch_myself_thinking_if_only_i_were_the_kind_of_person_wh",
    "There are things I want that I'd be embarrassed to admit": "there_are_things_i_want_that_id_be_embarrassed_to_admit",
    "I feel a pull toward luxury, attention, indulgence, or wildness, and immediately judge it": "i_feel_a_pull_toward_luxury_attention_indulgence_or_wildness_and_immed",
    "I feel more myself in a rare setting, like travel, certain people, alone, or a specific city": "i_feel_more_myself_in_a_rare_setting_like_travel_certain_people_alone_",
    "There's a version of me that comes out after a drink, on vacation, or with strangers, and I miss her": "theres_a_version_of_me_that_comes_out_after_a_drink_on_vacation_or_wit",
    "Other": "other"
  },
  "fascination-shares": {
    "Playful / funny / light": "playful_funny_light",
    "Bold / loud / unapologetic": "bold_loud_unapologetic",
    "Sensual / luxurious / indulgent": "sensual_luxurious_indulgent",
    "Soft / receiving / held": "soft_receiving_held",
    "Wild / free / untamed": "wild_free_untamed",
    "Slow / lazy / unproductive": "slow_lazy_unproductive",
    "Visible / seen / celebrated": "visible_seen_celebrated",
    "Wanting / asking / taking": "wanting_asking_taking",
    "Warm / messy / openly emotional": "warm_messy_openly_emotional",
    "Quiet but unbothered": "quiet_but_unbothered",
    "Other": "other"
  },
  "dinner-table-feeling": {
    "Guilty": "guilty",
    "Selfish": "selfish",
    "Like a burden": "like_a_burden",
    "Out of place": "out_of_place",
    "Embarrassed": "embarrassed",
    "Like I was making things harder": "like_i_was_making_things_harder",
    "Like I was being too much": "like_i_was_being_too_much",
    "Like I didn't fit the family": "like_i_didnt_fit_the_family",
    "Disloyal": "disloyal",
    "Other": "other"
  },
  "shadow-wants": {
    "To be visible / celebrated / admired": "to_be_visible_celebrated_admired",
    "To be wanted / desired / chosen": "to_be_wanted_desired_chosen",
    "To rest without earning it": "to_rest_without_earning_it",
    "To have luxury / beauty / excess": "to_have_luxury_beauty_excess",
    "To be taken care of": "to_be_taken_care_of",
    "To say no without guilt": "to_say_no_without_guilt",
    "To want things openly": "to_want_things_openly",
    "To take up space": "to_take_up_space",
    "To be playful / silly / not serious": "to_be_playful_silly_not_serious",
    "To be selfish sometimes": "to_be_selfish_sometimes",
    "To be soft / receiving": "to_be_soft_receiving",
    "To not be useful": "to_not_be_useful",
    "Other": "other"
  },
  "life-window": {
    "I'm 25-30 and just starting to feel the clash": "im_25_30_and_just_starting_to_feel_the_clash",
    "I'm 30-35 and I'm in the thick of it": "im_30_35_and_im_in_the_thick_of_it",
    "I'm 35-40 and I'm late to seeing it but I see it now": "im_35_40_and_im_late_to_seeing_it_but_i_see_it_now",
    "I'm past 40 and these patterns went unaddressed for years": "im_past_40_and_these_patterns_went_unaddressed_for_years",
    "I'm under 25 and I'm noticing it early": "im_under_25_and_im_noticing_it_early",
    "Other": "other"
  },
  "looping-dream-areas": {
    "A career move / business / creative project": "a_career_move_business_creative_project",
    "A relationship I want (or want to leave)": "a_relationship_i_want_or_want_to_leave",
    "My body / health / weight / energy": "my_body_health_weight_energy",
    "Money / receiving / charging more": "money_receiving_charging_more",
    "Visibility / putting myself out there": "visibility_putting_myself_out_there",
    "A creative dream I keep almost starting": "a_creative_dream_i_keep_almost_starting",
    "Moving / a place I want to live": "moving_a_place_i_want_to_live",
    "Becoming a mother / not becoming one": "becoming_a_mother_not_becoming_one",
    "A version of myself I keep almost becoming": "a_version_of_myself_i_keep_almost_becoming",
    "Other": "other"
  },
  "sabotage-mechanism": {
    "I get sick / exhausted / depleted": "i_get_sick_exhausted_depleted",
    "I get distracted / scattered / lose focus": "i_get_distracted_scattered_lose_focus",
    "I procrastinate or \"research\" instead of doing": "i_procrastinate_or_research_instead_of_doing",
    "I shrink the dream / make it smaller / \"be realistic\"": "i_shrink_the_dream_make_it_smaller_be_realistic",
    "I sabotage relationships that would support it": "i_sabotage_relationships_that_would_support_it",
    "I pick fights / create drama": "i_pick_fights_create_drama",
    "I become hyper-busy with other things": "i_become_hyper_busy_with_other_things",
    "I doubt myself into paralysis": "i_doubt_myself_into_paralysis",
    "I tell myself it's not the right time": "i_tell_myself_its_not_the_right_time",
    "I caretake someone else's needs instead": "i_caretake_someone_elses_needs_instead",
    "I get suddenly very tired / want to sleep": "i_get_suddenly_very_tired_want_to_sleep",
    "I find a financial reason to stop / anxiety over expenses or debts": "i_find_a_financial_reason_to_stop_anxiety_over_expenses_or_debts",
    "I lose interest right at the threshold": "i_lose_interest_right_at_the_threshold",
    "Other": "other"
  },
  "dream-shield": {
    "I'd lose connection with the people I love": "id_lose_connection_with_the_people_i_love",
    "I'd be too visible / too much / too seen": "id_be_too_visible_too_much_too_seen",
    "I'd outgrow my family / outshine them": "id_outgrow_my_family_outshine_them",
    "I'd be a burden / a target / resented": "id_be_a_burden_a_target_resented",
    "I'd betray someone": "id_betray_someone",
    "I'd be punished by life / something would be taken": "id_be_punished_by_life_something_would_be_taken",
    "I'd be exposed as a fraud": "id_be_exposed_as_a_fraud",
    "I'd have to feel everything I've been outrunning / responsibility": "id_have_to_feel_everything_ive_been_outrunning_responsibility",
    "I wouldn't know who I am anymore": "i_wouldnt_know_who_i_am_anymore",
    "I would lose my \"safe\" identity": "i_would_lose_my_safe_identity",
    "I don't know, but it feels dangerous": "i_dont_know_but_it_feels_dangerous",
    "Other": "other"
  },
  "current-resources": {
    "I can financially support myself (or have access to support)": "i_can_financially_support_myself_or_have_access_to_support",
    "I can leave a situation that doesn't feel right": "i_can_leave_a_situation_that_doesnt_feel_right",
    "I have at least one person I can be honest with": "i_have_at_least_one_person_i_can_be_honest_with",
    "I can say no, even if it's hard": "i_can_say_no_even_if_its_hard",
    "I have a body that has carried me through real things": "i_have_a_body_that_has_carried_me_through_real_things",
    "I have skills, knowledge, or experience I've earned": "i_have_skills_knowledge_or_experience_ive_earned",
    "I can ask for help (even imperfectly)": "i_can_ask_for_help_even_imperfectly",
    "I can be alone without it being unsafe": "i_can_be_alone_without_it_being_unsafe",
    "I can choose where I live, who I'm with, how I spend my time": "i_can_choose_where_i_live_who_im_with_how_i_spend_my_time",
    "I have language for what I feel (more than I did as a child)": "i_have_language_for_what_i_feel_more_than_i_did_as_a_child",
    "I'm no longer dependent on the people I had to protect myself from": "im_no_longer_dependent_on_the_people_i_had_to_protect_myself_from",
    "I have more agency over my body, my time, my decisions": "i_have_more_agency_over_my_body_my_time_my_decisions",
    "Other": "other"
  },
  "external-changes": {
    "The person whose wellbeing I tracked is no longer my responsibility (or is no longer here)": "the_person_whose_wellbeing_i_tracked_is_no_longer_my_responsibility_or",
    "I'm no longer living in that home": "im_no_longer_living_in_that_home",
    "The financial situation is different": "the_financial_situation_is_different",
    "The family dynamic has shifted": "the_family_dynamic_has_shifted",
    "I have my own home / space / room": "i_have_my_own_home_space_room",
    "I have relationships I chose, not just the ones I was born into": "i_have_relationships_i_chose_not_just_the_ones_i_was_born_into",
    "The fear I lived with as a child is no longer present in my daily life": "the_fear_i_lived_with_as_a_child_is_no_longer_present_in_my_daily_life",
    "The danger / fragility / illness that shaped me is no longer the air I breathe": "the_danger_fragility_illness_that_shaped_me_is_no_longer_the_air_i_bre",
    "I have distance, physical, emotional, or both, from the original conditions": "i_have_distance_physical_emotional_or_both_from_the_original_condition",
    "Other": "other"
  },
  "capacities-built": {
    "Recognize when something doesn't feel right": "recognize_when_something_doesnt_feel_right",
    "Walk away from people who harm me": "walk_away_from_people_who_harm_me",
    "Set a limit (even if I'm still practicing)": "set_a_limit_even_if_im_still_practicing",
    "Soothe myself when I'm activated": "soothe_myself_when_im_activated",
    "Identify what I'm feeling": "identify_what_im_feeling",
    "Ask a question instead of assuming": "ask_a_question_instead_of_assuming",
    "Repair after a rupture": "repair_after_a_rupture",
    "Choose who gets access to me": "choose_who_gets_access_to_me",
    "Tolerate someone being disappointed in me": "tolerate_someone_being_disappointed_in_me",
    "Sit with discomfort without immediately fixing it": "sit_with_discomfort_without_immediately_fixing_it",
    "Other": "other"
  },
  "somatic-recognition": {
    "A softening, a small relief": "a_softening_a_small_relief",
    "Something doesn't believe it yet, but my mind sees it": "something_doesnt_believe_it_yet_but_my_mind_sees_it",
    "Tears, or something that wants to release": "tears_or_something_that_wants_to_release",
    "Resistance, like my body doesn't trust this": "resistance_like_my_body_doesnt_trust_this",
    "Surprise, I hadn't really seen all of this before": "surprise_i_hadnt_really_seen_all_of_this_before",
    "A quiet \"oh\"": "a_quiet_oh",
    "I don't feel anything yet, I want to explore this in session": "i_dont_feel_anything_yet_i_want_to_explore_this_in_session",
    "Other": "other"
  },
  "protection-accomplished": {
    "It kept me safe in a situation I couldn't have changed": "it_kept_me_safe_in_a_situation_i_couldnt_have_changed",
    "It let me get through childhood with my dignity intact": "it_let_me_get_through_childhood_with_my_dignity_intact",
    "It helped me become responsible / capable": "it_helped_me_become_responsible_capable",
    "It gave me a sense of agency when I had none": "it_gave_me_a_sense_of_agency_when_i_had_none",
    "It protected someone I loved": "it_protected_someone_i_loved",
    "It earned me the love or peace I needed": "it_earned_me_the_love_or_peace_i_needed",
    "It got me out / got me here": "it_got_me_out_got_me_here",
    "It built a life I'm now actually able to live in": "it_built_a_life_im_now_actually_able_to_live_in",
    "It made me someone people can count on": "it_made_me_someone_people_can_count_on",
    "It gave me a way to be useful when I felt powerless": "it_gave_me_a_way_to_be_useful_when_i_felt_powerless",
    "Other": "other"
  },
  "strengths-forged": {
    "Deep attunement to others": "deep_attunement_to_others",
    "Ability to read a room instantly": "ability_to_read_a_room_instantly",
    "Reliability / follow-through": "reliability_follow_through",
    "Emotional sensitivity": "emotional_sensitivity",
    "Empathy": "empathy",
    "Maturity / depth": "maturity_depth",
    "Resilience": "resilience",
    "Anticipation / foresight": "anticipation_foresight",
    "Ability to hold complexity": "ability_to_hold_complexity",
    "Capacity to show up for others": "capacity_to_show_up_for_others",
    "Discipline": "discipline",
    "Self-sufficiency": "self_sufficiency",
    "Inner steadiness under pressure": "inner_steadiness_under_pressure",
    "Other": "other"
  },
  "jobs-done": {
    "Track everyone's mood for safety reasons": "track_everyones_mood_for_safety_reasons",
    "Anticipate danger that isn't there": "anticipate_danger_that_isnt_there",
    "Earn love that's already given": "earn_love_thats_already_given",
    "Prevent abandonment that isn't coming": "prevent_abandonment_that_isnt_coming",
    "Hold the family together": "hold_the_family_together",
    "Protect a parent who is no longer fragile (or no longer here)": "protect_a_parent_who_is_no_longer_fragile_or_no_longer_here",
    "Stay small so others can be big": "stay_small_so_others_can_be_big",
    "Be useful in order to be allowed to exist": "be_useful_in_order_to_be_allowed_to_exist",
    "Perform okay-ness when I'm not okay": "perform_okay_ness_when_im_not_okay",
    "Carry weight that wasn't mine to carry": "carry_weight_that_wasnt_mine_to_carry",
    "Other": "other"
  },
  "promotion": {
    "From hyper-vigilance to discernment": "from_hyper_vigilance_to_discernment",
    "From caretaking everyone to caring for what's actually mine": "from_caretaking_everyone_to_caring_for_whats_actually_mine",
    "From productivity-as-survival to creation as expression": "from_productivity_as_survival_to_creation_as_expression",
    "From perfectionism to craft": "from_perfectionism_to_craft",
    "From people-pleasing to genuine generosity": "from_people_pleasing_to_genuine_generosity",
    "From self-sufficiency to interdependence": "from_self_sufficiency_to_interdependence",
    "From anticipating danger to sensing aliveness": "from_anticipating_danger_to_sensing_aliveness",
    "From holding it together to letting things move through me": "from_holding_it_together_to_letting_things_move_through_me",
    "From earning love to receiving love": "from_earning_love_to_receiving_love",
    "From staying small to taking up the space that's mine": "from_staying_small_to_taking_up_the_space_thats_mine",
    "Other": "other"
  },
  "quiet-protection": {
    "I'm slower": "im_slower",
    "I'm warmer": "im_warmer",
    "I'm funnier": "im_funnier",
    "I'm quieter": "im_quieter",
    "I'm more sensual": "im_more_sensual",
    "I'm more curious": "im_more_curious",
    "I'm more playful": "im_more_playful",
    "I'm more direct": "im_more_direct",
    "I'm more affectionate": "im_more_affectionate",
    "I'm more spacious": "im_more_spacious",
    "I'm more present": "im_more_present",
    "I'm more honest": "im_more_honest",
    "I notice things I usually miss": "i_notice_things_i_usually_miss",
    "I don't know, I'm not sure I've felt that": "i_dont_know_im_not_sure_ive_felt_that",
    "Other": "other"
  },
  "never-tested": {
    "Whether I'd actually be loved if I weren't useful": "whether_id_actually_be_loved_if_i_werent_useful",
    "Whether I'd be safe if I weren't perfect": "whether_id_be_safe_if_i_werent_perfect",
    "Whether anyone would stay if I were difficult": "whether_anyone_would_stay_if_i_were_difficult",
    "Whether I could rest without falling apart": "whether_i_could_rest_without_falling_apart",
    "Whether I could want something openly without losing it": "whether_i_could_want_something_openly_without_losing_it",
    "Whether I could be wrong and still be okay": "whether_i_could_be_wrong_and_still_be_okay",
    "Whether I could disappoint someone and survive it": "whether_i_could_disappoint_someone_and_survive_it",
    "Whether I could be slow without being left behind": "whether_i_could_be_slow_without_being_left_behind",
    "Whether I could be soft without being crushed": "whether_i_could_be_soft_without_being_crushed",
    "Whether I could need without being a burden": "whether_i_could_need_without_being_a_burden",
    "Whether I could just be without earning it": "whether_i_could_just_be_without_earning_it",
    "Other": "other"
  },
  "outside-image": {
    "I have a clear, vivid image of her": "i_have_a_clear_vivid_image_of_her",
    "I have a vague sense but I can't really feel her": "i_have_a_vague_sense_but_i_cant_really_feel_her",
    "I have an image but I suspect it's still a performance": "i_have_an_image_but_i_suspect_its_still_a_performance",
    "I genuinely don't know who I am underneath": "i_genuinely_dont_know_who_i_am_underneath",
    "I'm afraid there's nothing underneath": "im_afraid_theres_nothing_underneath",
    "I've glimpsed her but I don't trust it yet": "ive_glimpsed_her_but_i_dont_trust_it_yet",
    "Other": "other"
  },
  "not-knowing": {
    "A relief, I've been pressuring myself to know": "a_relief_ive_been_pressuring_myself_to_know",
    "Uncomfortable but okay": "uncomfortable_but_okay",
    "Hard, I want an answer": "hard_i_want_an_answer",
    "Scary, I feel ungrounded without one": "scary_i_feel_ungrounded_without_one",
    "I want to explore this in session": "i_want_to_explore_this_in_session",
    "Other": "other"
  },
  "finding-out-fear": {
    "I'm afraid she'll be disappointing": "im_afraid_shell_be_disappointing",
    "I'm afraid she'll be too much": "im_afraid_shell_be_too_much",
    "I'm afraid she won't be loved the same way": "im_afraid_she_wont_be_loved_the_same_way",
    "I'm afraid she'll outgrow people I love": "im_afraid_shell_outgrow_people_i_love",
    "I'm afraid she'll be selfish": "im_afraid_shell_be_selfish",
    "I'm afraid I won't recognize her": "im_afraid_i_wont_recognize_her",
    "I'm afraid she'll make me grieve who I've been": "im_afraid_shell_make_me_grieve_who_ive_been",
    "I'm afraid I'll have to change my life in ways I'm not ready for": "im_afraid_ill_have_to_change_my_life_in_ways_im_not_ready_for",
    "I'm afraid I won't be able to go back": "im_afraid_i_wont_be_able_to_go_back",
    "I'm afraid she'll be the same as the protected one and I'll have done all this for nothing": "im_afraid_shell_be_the_same_as_the_protected_one_and_ill_have_done_all",
    "Other": "other"
  }
};

export const QUESTIONNAIRE_STATE_VERSION = 2;

export function migrateLegacyAnswers(answers: Answers): Answers {
  return Object.fromEntries(Object.entries(answers).map(([questionId, value]) => {
    const labels = LEGACY_ANSWER_LABELS[questionId];
    if (!labels) return [questionId, value];
    const migrate = (item: string) => {
      const migrated = labels[item];
      if (!migrated && Object.keys(labels).length && item.includes(" ")) {
        console.warn(`[questionnaire] Preserving unknown legacy answer for ${questionId}.`);
      }
      return migrated ?? item;
    };
    if (Array.isArray(value)) return [questionId, value.map(migrate)];
    if (typeof value === "string") return [questionId, migrate(value)];
    return [questionId, value];
  }));
}
