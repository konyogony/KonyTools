export interface IReminder {
    interaction_user_id: string;
    interaction_user_img: string;
    content: string;
    time: number;
    timezone: string;
    user_mention_id: string;
}

export interface INote {
    interaction_user_id: string;
    interaction_user_img: string;
    time_created: number;
    public: boolean;
    content: string;
}

interface Faction {
    team_id: string;
    nickname: string;
    avatar: string;
    type: string;
    players: {
        player_id: string;
        nickname: string;
        avatar: string;
        skill_level: number;
        game_player_id: string;
        game_player_name: string;
        faceit_url: string;
    }[];
}

export interface IMatch {
    match_id: string;
    game_id: string;
    region: string;
    match_type: string;
    game_mode: string;
    max_players: number;
    teams_size: number;
    teams: {
        faction1: Faction;
        faction2: Faction;
    };
    playing_players: string[];
    competition_id: string;
    competition_name: string;
    competition_type: string;
    organizer_id: string;
    status: string;
    started_at: number;
    finished_at: number;
    results: {
        winner: 'faction2' | 'faction1';
        score: {
            faction2: number;
            faction1: number;
        };
    };
    faceit_url: string;
}
