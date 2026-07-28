import type { ArchetypeId } from "./archetypes";

export type QuestionType = "single" | "multi" | "text";
export type Option = { id: string; weights?: Partial<Record<ArchetypeId, number>> };
export type Screen =
  | { id: string; type: "intro" | "insight"; sectionId: string }
  | { id: string; type: "featured"; sectionId: string; childhoodQuestionId: string; sabotageQuestionId: string }
  | { id: string; type: "question"; sectionId: string; questionType: QuestionType; optional?: boolean; options?: Option[] };

export const questionnaireScreens: Screen[] = [
  {
    "id": "orientation",
    "type": "intro",
    "sectionId": "orientation"
  },
  {
    "id": "audit-focus",
    "type": "intro",
    "sectionId": "audit_focus"
  },
  {
    "id": "age",
    "type": "question",
    "sectionId": "audit_focus",
    "questionType": "text"
  },
  {
    "id": "why-now",
    "type": "question",
    "sectionId": "audit_focus",
    "questionType": "text"
  },
  {
    "id": "stuck-areas",
    "type": "question",
    "sectionId": "audit_focus",
    "questionType": "multi",
    "options": [
      {
        "id": "career_purpose",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "body_health",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "relationships_intimacy",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "money_receiving",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "identity_sense_of_self",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "creativity_expression",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "first-25",
    "type": "intro",
    "sectionId": "the_first_25_years"
  },
  {
    "id": "family-role",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "multi",
    "options": [
      {
        "id": "the_responsible_one",
        "weights": {
          "anticipator": 1,
          "performer": 2
        }
      },
      {
        "id": "the_peacemaker",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "the_caretaker",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "the_achiever_the_proof",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "the_invisible_one",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "the_funny_one_the_relief",
        "weights": {
          "harmonizer": 1
        }
      },
      {
        "id": "the_strong_one",
        "weights": {
          "performer": 1,
          "anticipator": 1
        }
      },
      {
        "id": "the_problem",
        "weights": {
          "quiter": 1
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "childhood-truths",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "multi",
    "options": [
      {
        "id": "i_tried_not_to_be_a_burden",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_tried_not_to_add_stress_to_anyone",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_was_the_easy_one_the_good_one",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_learned_to_read_the_room_before_i_spoke",
        "weights": {
          "anticipator": 2,
          "harmonizer": 1
        }
      },
      {
        "id": "i_kept_my_problems_to_myself",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_felt_responsible_for_someone_elses_wellbeing",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_felt_i_had_to_be_okay_so_others_could_be_okay",
        "weights": {
          "harmonizer": 2,
          "performer": 1
        }
      },
      {
        "id": "i_grew_up_faster_than_i_needed_to",
        "weights": {
          "performer": 1,
          "anticipator": 1
        }
      },
      {
        "id": "i_didnt_want_to_take_up_space",
        "weights": {
          "harmonizer": 1,
          "quiter": 1
        }
      },
      {
        "id": "i_performed_being_fine",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "learned-when",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "text"
  },
  {
    "id": "home-climate",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "single",
    "options": [
      {
        "id": "tense_walking_on_eggshells",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "cold_disconnected",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "chaotic_unpredictable",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "over_involved_enmeshed",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "performative_image_focused",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "warm_but_conditional",
        "weights": {
          "performer": 1,
          "harmonizer": 1
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "tracked-wellbeing",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "multi",
    "options": [
      {
        "id": "a_parents_health_physical_or_mental",
        "weights": {
          "anticipator": 2,
          "harmonizer": 1
        }
      },
      {
        "id": "a_parents_mood_emotions",
        "weights": {
          "anticipator": 1,
          "harmonizer": 2
        }
      },
      {
        "id": "a_sibling_who_needed_extra_care_or_attention",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "the_familys_image_reputation",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "the_peace_of_the_home",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "a_financial_situation",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "a_grief_loss_the_family_carried",
        "weights": {
          "anticipator": 1,
          "quiter": 1
        }
      },
      {
        "id": "an_unspoken_tension_no_one_talked_about",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "none_that_im_aware_of"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "unspoken-noticed",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "text"
  },
  {
    "id": "unspoken-rules",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "multi",
    "options": [
      {
        "id": "dont_make_things_harder",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "dont_be_the_reason_someone_worries",
        "weights": {
          "harmonizer": 2,
          "anticipator": 1
        }
      },
      {
        "id": "stay_small_with_your_needs",
        "weights": {
          "harmonizer": 1,
          "quiter": 1
        }
      },
      {
        "id": "be_the_one_whos_okay",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "achieve_succeed_make_us_proud",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "dont_outshine",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "hold_it_together",
        "weights": {
          "performer": 1,
          "anticipator": 1
        }
      },
      {
        "id": "be_grateful_dont_complain",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "be_useful",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "be_good",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "dont_need_too_much",
        "weights": {
          "harmonizer": 1,
          "quiter": 1
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "felt-cost",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "text"
  },
  {
    "id": "childhood-movement",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "multi",
    "options": [
      {
        "id": "always_one_step_ahead_anticipating",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "quietly_observing_before_acting",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "tip_toeing_careful_not_to_disturb",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "performing_okay_ness",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "caring_for_others_before_myself",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "hyper_organized_hyper_responsible",
        "weights": {
          "anticipator": 1,
          "performer": 2
        }
      },
      {
        "id": "gentle_not_too_much_not_too_loud",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "mature_for_my_age",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "the_easy_child",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "always_moving_to_the_next_thing",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "recognize-now",
    "type": "question",
    "sectionId": "the_first_25_years",
    "questionType": "text"
  },
  {
    "id": "blind-spot",
    "type": "intro",
    "sectionId": "the_blind_spot"
  },
  {
    "id": "hard-to-stop",
    "type": "question",
    "sectionId": "the_blind_spot",
    "questionType": "multi",
    "options": [
      {
        "id": "planning_ahead_running_scenarios",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "mentally_to_do_listing",
        "weights": {
          "anticipator": 1,
          "performer": 1
        }
      },
      {
        "id": "checking_on_people_you_love",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "producing_achieving_progressing",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "improving_yourself",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "anticipating_what_could_go_wrong",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "tracking_everyones_mood_needs",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "optimizing_your_time",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "being_useful",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "preparing",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "tidying_organizing_arranging",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "body-when-stop",
    "type": "question",
    "sectionId": "the_blind_spot",
    "questionType": "text"
  },
  {
    "id": "slowing-fear",
    "type": "question",
    "sectionId": "the_blind_spot",
    "questionType": "multi",
    "options": [
      {
        "id": "ill_fall_behind_lose_my_edge",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "something_bad_will_happen_to_someone_i_love",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "ill_be_seen_as_lazy_selfish_useless",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "ill_lose_myself_disappear",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "ill_feel_everything_ive_been_outrunning",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "ill_become_a_burden",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_wont_be_loved_the_same_way",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_wont_matter",
        "weights": {
          "performer": 1,
          "quiter": 1
        }
      },
      {
        "id": "ill_get_sick",
        "weights": {
          "anticipator": 1,
          "quiter": 1
        }
      },
      {
        "id": "i_dont_know_but_it_feels_unsafe",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "as-long-as",
    "type": "question",
    "sectionId": "the_blind_spot",
    "questionType": "text"
  },
  {
    "id": "present-memory",
    "type": "question",
    "sectionId": "the_blind_spot",
    "questionType": "text"
  },
  {
    "id": "shadow-intro",
    "type": "intro",
    "sectionId": "the_shadow_personality"
  },
  {
    "id": "shadow-clues",
    "type": "question",
    "sectionId": "the_shadow_personality",
    "questionType": "multi",
    "options": [
      {
        "id": "i_feel_a_sharp_envy_when_i_see_certain_women_confident_loud_sensual_fr",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_am_fascinated_by_women_who_seem_to_get_away_with_things_i_never_coul",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_have_a_private_fantasy_version_of_myself_i_never_let_out",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_sometimes_catch_myself_thinking_if_only_i_were_the_kind_of_person_wh",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "there_are_things_i_want_that_id_be_embarrassed_to_admit",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_feel_a_pull_toward_luxury_attention_indulgence_or_wildness_and_immed",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "i_feel_more_myself_in_a_rare_setting_like_travel_certain_people_alone_",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "theres_a_version_of_me_that_comes_out_after_a_drink_on_vacation_or_wit",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "shadow-trigger",
    "type": "question",
    "sectionId": "the_shadow_personality",
    "questionType": "text"
  },
  {
    "id": "fascination-shares",
    "type": "question",
    "sectionId": "the_shadow_personality",
    "questionType": "multi",
    "options": [
      {
        "id": "playful_funny_light",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "bold_loud_unapologetic",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "sensual_luxurious_indulgent",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "soft_receiving_held",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "wild_free_untamed",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "slow_lazy_unproductive",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "visible_seen_celebrated",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "wanting_asking_taking",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "warm_messy_openly_emotional",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "quiet_but_unbothered",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "dinner-table-feeling",
    "type": "question",
    "sectionId": "the_shadow_personality",
    "questionType": "multi",
    "options": [
      {
        "id": "guilty",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "selfish",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "like_a_burden",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "out_of_place",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "embarrassed",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "like_i_was_making_things_harder",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "like_i_was_being_too_much",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "like_i_didnt_fit_the_family",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "disloyal",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "shadow-wants",
    "type": "question",
    "sectionId": "the_shadow_personality",
    "questionType": "multi",
    "options": [
      {
        "id": "to_be_visible_celebrated_admired",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "to_be_wanted_desired_chosen",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "to_rest_without_earning_it",
        "weights": {
          "performer": 2,
          "quiter": 1
        }
      },
      {
        "id": "to_have_luxury_beauty_excess",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "to_be_taken_care_of",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "to_say_no_without_guilt",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "to_want_things_openly",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "to_take_up_space",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "to_be_playful_silly_not_serious",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "to_be_selfish_sometimes",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "to_be_soft_receiving",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "to_not_be_useful",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "most-forbidden",
    "type": "question",
    "sectionId": "the_shadow_personality",
    "questionType": "text"
  },
  {
    "id": "dreams-intro",
    "type": "intro",
    "sectionId": "where_dreams_meet_protection"
  },
  {
    "id": "life-window",
    "type": "question",
    "sectionId": "where_dreams_meet_protection",
    "questionType": "single",
    "options": [
      {
        "id": "im_25_30_and_just_starting_to_feel_the_clash"
      },
      {
        "id": "im_30_35_and_im_in_the_thick_of_it"
      },
      {
        "id": "im_35_40_and_im_late_to_seeing_it_but_i_see_it_now"
      },
      {
        "id": "im_past_40_and_these_patterns_went_unaddressed_for_years"
      },
      {
        "id": "im_under_25_and_im_noticing_it_early"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "looping-dream-areas",
    "type": "question",
    "sectionId": "where_dreams_meet_protection",
    "questionType": "multi",
    "options": [
      {
        "id": "a_career_move_business_creative_project",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "a_relationship_i_want_or_want_to_leave",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "my_body_health_weight_energy",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "money_receiving_charging_more",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "visibility_putting_myself_out_there",
        "weights": {
          "performer": 1,
          "harmonizer": 1
        }
      },
      {
        "id": "a_creative_dream_i_keep_almost_starting",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "moving_a_place_i_want_to_live",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "becoming_a_mother_not_becoming_one",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "a_version_of_myself_i_keep_almost_becoming",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "specific-dream",
    "type": "question",
    "sectionId": "where_dreams_meet_protection",
    "questionType": "text"
  },
  {
    "id": "sabotage-mechanism",
    "type": "question",
    "sectionId": "where_dreams_meet_protection",
    "questionType": "multi",
    "options": [
      {
        "id": "i_get_sick_exhausted_depleted",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_get_distracted_scattered_lose_focus",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_procrastinate_or_research_instead_of_doing",
        "weights": {
          "quiter": 1,
          "anticipator": 1
        }
      },
      {
        "id": "i_shrink_the_dream_make_it_smaller_be_realistic",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_sabotage_relationships_that_would_support_it",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_pick_fights_create_drama",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "i_become_hyper_busy_with_other_things",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "i_doubt_myself_into_paralysis",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "i_tell_myself_its_not_the_right_time",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_caretake_someone_elses_needs_instead",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_get_suddenly_very_tired_want_to_sleep",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_find_a_financial_reason_to_stop_anxiety_over_expenses_or_debts",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "i_lose_interest_right_at_the_threshold",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "dream-protection-match",
    "type": "featured",
    "sectionId": "where_dreams_meet_protection",
    "childhoodQuestionId": "childhood-movement",
    "sabotageQuestionId": "sabotage-mechanism"
  },
  {
    "id": "body-data",
    "type": "question",
    "sectionId": "where_dreams_meet_protection",
    "questionType": "text"
  },
  {
    "id": "dream-shield",
    "type": "question",
    "sectionId": "where_dreams_meet_protection",
    "questionType": "multi",
    "options": [
      {
        "id": "id_lose_connection_with_the_people_i_love",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "id_be_too_visible_too_much_too_seen",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "id_outgrow_my_family_outshine_them",
        "weights": {
          "harmonizer": 1,
          "performer": 1
        }
      },
      {
        "id": "id_be_a_burden_a_target_resented",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "id_betray_someone",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "id_be_punished_by_life_something_would_be_taken",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "id_be_exposed_as_a_fraud",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "id_have_to_feel_everything_ive_been_outrunning_responsibility",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_wouldnt_know_who_i_am_anymore",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_would_lose_my_safe_identity",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "i_dont_know_but_it_feels_dangerous",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "system-expiration",
    "type": "intro",
    "sectionId": "system_expiration"
  },
  {
    "id": "current-resources",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "multi",
    "options": [
      {
        "id": "i_can_financially_support_myself_or_have_access_to_support"
      },
      {
        "id": "i_can_leave_a_situation_that_doesnt_feel_right"
      },
      {
        "id": "i_have_at_least_one_person_i_can_be_honest_with"
      },
      {
        "id": "i_can_say_no_even_if_its_hard"
      },
      {
        "id": "i_have_a_body_that_has_carried_me_through_real_things"
      },
      {
        "id": "i_have_skills_knowledge_or_experience_ive_earned"
      },
      {
        "id": "i_can_ask_for_help_even_imperfectly"
      },
      {
        "id": "i_can_be_alone_without_it_being_unsafe"
      },
      {
        "id": "i_can_choose_where_i_live_who_im_with_how_i_spend_my_time"
      },
      {
        "id": "i_have_language_for_what_i_feel_more_than_i_did_as_a_child"
      },
      {
        "id": "im_no_longer_dependent_on_the_people_i_had_to_protect_myself_from"
      },
      {
        "id": "i_have_more_agency_over_my_body_my_time_my_decisions"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "resources-body",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "text"
  },
  {
    "id": "external-changes",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "multi",
    "options": [
      {
        "id": "the_person_whose_wellbeing_i_tracked_is_no_longer_my_responsibility_or"
      },
      {
        "id": "im_no_longer_living_in_that_home"
      },
      {
        "id": "the_financial_situation_is_different"
      },
      {
        "id": "the_family_dynamic_has_shifted"
      },
      {
        "id": "i_have_my_own_home_space_room"
      },
      {
        "id": "i_have_relationships_i_chose_not_just_the_ones_i_was_born_into"
      },
      {
        "id": "the_fear_i_lived_with_as_a_child_is_no_longer_present_in_my_daily_life"
      },
      {
        "id": "the_danger_fragility_illness_that_shaped_me_is_no_longer_the_air_i_bre"
      },
      {
        "id": "i_have_distance_physical_emotional_or_both_from_the_original_condition"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "child-impossible",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "text",
    "optional": true
  },
  {
    "id": "capacities-built",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "multi",
    "options": [
      {
        "id": "recognize_when_something_doesnt_feel_right"
      },
      {
        "id": "walk_away_from_people_who_harm_me"
      },
      {
        "id": "set_a_limit_even_if_im_still_practicing"
      },
      {
        "id": "soothe_myself_when_im_activated"
      },
      {
        "id": "identify_what_im_feeling"
      },
      {
        "id": "ask_a_question_instead_of_assuming"
      },
      {
        "id": "repair_after_a_rupture"
      },
      {
        "id": "choose_who_gets_access_to_me"
      },
      {
        "id": "tolerate_someone_being_disappointed_in_me"
      },
      {
        "id": "sit_with_discomfort_without_immediately_fixing_it"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "child-changed-everything",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "text",
    "optional": true
  },
  {
    "id": "somatic-recognition",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "single",
    "options": [
      {
        "id": "a_softening_a_small_relief"
      },
      {
        "id": "something_doesnt_believe_it_yet_but_my_mind_sees_it"
      },
      {
        "id": "tears_or_something_that_wants_to_release"
      },
      {
        "id": "resistance_like_my_body_doesnt_trust_this"
      },
      {
        "id": "surprise_i_hadnt_really_seen_all_of_this_before"
      },
      {
        "id": "a_quiet_oh"
      },
      {
        "id": "i_dont_feel_anything_yet_i_want_to_explore_this_in_session"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "updated-self",
    "type": "question",
    "sectionId": "system_expiration",
    "questionType": "text"
  },
  {
    "id": "honoring-intro",
    "type": "intro",
    "sectionId": "honoring_the_protection"
  },
  {
    "id": "protection-accomplished",
    "type": "question",
    "sectionId": "honoring_the_protection",
    "questionType": "multi",
    "options": [
      {
        "id": "it_kept_me_safe_in_a_situation_i_couldnt_have_changed"
      },
      {
        "id": "it_let_me_get_through_childhood_with_my_dignity_intact"
      },
      {
        "id": "it_helped_me_become_responsible_capable"
      },
      {
        "id": "it_gave_me_a_sense_of_agency_when_i_had_none"
      },
      {
        "id": "it_protected_someone_i_loved"
      },
      {
        "id": "it_earned_me_the_love_or_peace_i_needed"
      },
      {
        "id": "it_got_me_out_got_me_here"
      },
      {
        "id": "it_built_a_life_im_now_actually_able_to_live_in"
      },
      {
        "id": "it_made_me_someone_people_can_count_on"
      },
      {
        "id": "it_gave_me_a_way_to_be_useful_when_i_felt_powerless"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "strengths-forged",
    "type": "question",
    "sectionId": "honoring_the_protection",
    "questionType": "multi",
    "options": [
      {
        "id": "deep_attunement_to_others",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "ability_to_read_a_room_instantly",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "reliability_follow_through",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "emotional_sensitivity",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "empathy",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "maturity_depth",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "resilience",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "anticipation_foresight",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "ability_to_hold_complexity",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "capacity_to_show_up_for_others",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "discipline",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "self_sufficiency",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "inner_steadiness_under_pressure",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "strengths-keep",
    "type": "question",
    "sectionId": "honoring_the_protection",
    "questionType": "text"
  },
  {
    "id": "jobs-done",
    "type": "question",
    "sectionId": "honoring_the_protection",
    "questionType": "multi",
    "options": [
      {
        "id": "track_everyones_mood_for_safety_reasons",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "anticipate_danger_that_isnt_there",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "earn_love_thats_already_given",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "prevent_abandonment_that_isnt_coming",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "hold_the_family_together",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "protect_a_parent_who_is_no_longer_fragile_or_no_longer_here",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "stay_small_so_others_can_be_big",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "be_useful_in_order_to_be_allowed_to_exist",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "perform_okay_ness_when_im_not_okay",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "carry_weight_that_wasnt_mine_to_carry",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "jobs-reflection",
    "type": "question",
    "sectionId": "honoring_the_protection",
    "questionType": "text"
  },
  {
    "id": "promotion",
    "type": "question",
    "sectionId": "honoring_the_protection",
    "questionType": "multi",
    "options": [
      {
        "id": "from_hyper_vigilance_to_discernment",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "from_caretaking_everyone_to_caring_for_whats_actually_mine",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "from_productivity_as_survival_to_creation_as_expression",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "from_perfectionism_to_craft",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "from_people_pleasing_to_genuine_generosity",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "from_self_sufficiency_to_interdependence",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "from_anticipating_danger_to_sensing_aliveness",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "from_holding_it_together_to_letting_things_move_through_me",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "from_earning_love_to_receiving_love",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "from_staying_small_to_taking_up_the_space_thats_mine",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "thank-protection",
    "type": "question",
    "sectionId": "honoring_the_protection",
    "questionType": "text"
  },
  {
    "id": "identity-intro",
    "type": "intro",
    "sectionId": "identity_inquiry"
  },
  {
    "id": "quiet-protection",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "multi",
    "options": [
      {
        "id": "im_slower",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "im_warmer",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "im_funnier",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "im_quieter",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "im_more_sensual",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "im_more_curious",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "im_more_playful",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "im_more_direct",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "im_more_affectionate",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "im_more_spacious",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "im_more_present",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "im_more_honest",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "i_notice_things_i_usually_miss",
        "weights": {
          "anticipator": 2
        }
      },
      {
        "id": "i_dont_know_im_not_sure_ive_felt_that"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "quiet-moment-detail",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "text"
  },
  {
    "id": "never-tested",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "multi",
    "options": [
      {
        "id": "whether_id_actually_be_loved_if_i_werent_useful",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "whether_id_be_safe_if_i_werent_perfect",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "whether_anyone_would_stay_if_i_were_difficult",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "whether_i_could_rest_without_falling_apart",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "whether_i_could_want_something_openly_without_losing_it",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "whether_i_could_be_wrong_and_still_be_okay",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "whether_i_could_disappoint_someone_and_survive_it",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "whether_i_could_be_slow_without_being_left_behind",
        "weights": {
          "quiter": 2
        }
      },
      {
        "id": "whether_i_could_be_soft_without_being_crushed",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "whether_i_could_need_without_being_a_burden",
        "weights": {
          "harmonizer": 2
        }
      },
      {
        "id": "whether_i_could_just_be_without_earning_it",
        "weights": {
          "performer": 2
        }
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "scary-test",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "text"
  },
  {
    "id": "outside-image",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "single",
    "options": [
      {
        "id": "i_have_a_clear_vivid_image_of_her"
      },
      {
        "id": "i_have_a_vague_sense_but_i_cant_really_feel_her"
      },
      {
        "id": "i_have_an_image_but_i_suspect_its_still_a_performance"
      },
      {
        "id": "i_genuinely_dont_know_who_i_am_underneath"
      },
      {
        "id": "im_afraid_theres_nothing_underneath"
      },
      {
        "id": "ive_glimpsed_her_but_i_dont_trust_it_yet"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "not-knowing",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "single",
    "options": [
      {
        "id": "a_relief_ive_been_pressuring_myself_to_know"
      },
      {
        "id": "uncomfortable_but_okay"
      },
      {
        "id": "hard_i_want_an_answer"
      },
      {
        "id": "scary_i_feel_ungrounded_without_one"
      },
      {
        "id": "i_want_to_explore_this_in_session"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "small-evidence",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "text"
  },
  {
    "id": "finding-out-fear",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "multi",
    "options": [
      {
        "id": "im_afraid_shell_be_disappointing"
      },
      {
        "id": "im_afraid_shell_be_too_much"
      },
      {
        "id": "im_afraid_she_wont_be_loved_the_same_way"
      },
      {
        "id": "im_afraid_shell_outgrow_people_i_love"
      },
      {
        "id": "im_afraid_shell_be_selfish"
      },
      {
        "id": "im_afraid_i_wont_recognize_her"
      },
      {
        "id": "im_afraid_shell_make_me_grieve_who_ive_been"
      },
      {
        "id": "im_afraid_ill_have_to_change_my_life_in_ways_im_not_ready_for"
      },
      {
        "id": "im_afraid_i_wont_be_able_to_go_back"
      },
      {
        "id": "im_afraid_shell_be_the_same_as_the_protected_one_and_ill_have_done_all"
      },
      {
        "id": "other"
      }
    ]
  },
  {
    "id": "grief",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "text"
  },
  {
    "id": "closing-recognition",
    "type": "question",
    "sectionId": "identity_inquiry",
    "questionType": "text"
  }
];

export const questionScreens = questionnaireScreens.filter((screen): screen is Extract<Screen, {type: "question"}> => screen.type === "question");
export const totalQuestionCount = questionScreens.length;
