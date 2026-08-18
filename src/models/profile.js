export class Profile {
    constructor(id, email, notificationsEnabled, updatedAt, sortBy, preferedBroker) {
        this.id = id;
        this.email = email;
        this.notificationsEnabled = notificationsEnabled;
        this.updatedAt = updatedAt;
        this.sortBy = sortBy;
        this.preferedBroker = preferedBroker;
    }

    static fromJson(json) {
        return new Profile(
            json.id,
            json.email,
            json.notifications_enabled,
            json.updated_at,
            json.sort_by,
            json.prefered_broker
        );
    }
}