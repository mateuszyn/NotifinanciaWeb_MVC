export class Profile {
    constructor(id, email, notificationsEnabled, updatedAt, sortBy, preferredBroker) {
        this.id = id;
        this.email = email;
        this.notificationsEnabled = notificationsEnabled;
        this.updatedAt = updatedAt;
        this.sortBy = sortBy;
        this.preferredBroker = preferredBroker;
    }

    static fromJson(json) {
        return new Profile(
            json.id,
            json.email,
            json.notifications_enabled,
            json.updated_at,
            json.sort_by,
            json.preferred_broker
        );
    }
}