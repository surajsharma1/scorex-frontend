declare const api: import("axios").AxiosInstance;
export declare const authAPI: {
    register: (data: {
        username: string;
        email: string;
        password: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    login: (data: {
        email: string;
        password: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const tournamentAPI: {
    getTournaments: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createTournament: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getTournament: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateTournament: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteTournament: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const teamAPI: {
    getTeams: (tournamentId?: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createTeam: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateTeam: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteTeam: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    addPlayer: (teamId: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const bracketAPI: {
    getBrackets: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createBracket: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateBracket: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    generateBracket: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const overlayAPI: {
    getOverlays: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createOverlay: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateOverlay: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteOverlay: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export default api;
//# sourceMappingURL=api.d.ts.map