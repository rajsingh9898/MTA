// Profile data storage utilities
// In a real app, this would connect to your database

export interface ProfileData {
    firstName: string
    lastName: string
    bio: string
    phone: string
    location: string
    emailNotifications: boolean
    pushNotifications: boolean
}

const STORAGE_KEY = 'mta-profile-data'

export const profileStorage = {
    // Get profile data from localStorage
    get: (): ProfileData | null => {
        if (typeof window === 'undefined') return null
        
        try {
            const data = localStorage.getItem(STORAGE_KEY)
            return data ? JSON.parse(data) : null
        } catch (error) {
            console.error('Error loading profile data:', error)
            return null
        }
    },

    // Save profile data to localStorage
    save: (data: ProfileData): boolean => {
        if (typeof window === 'undefined') return false
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
            // Trigger storage event for real-time updates
            window.dispatchEvent(new Event('storage'))
            return true
        } catch (error) {
            console.error('Error saving profile data:', error)
            return false
        }
    },

    // Update specific fields
    update: (updates: Partial<ProfileData>): boolean => {
        const current = profileStorage.get()
        if (!current) return false
        
        const updated = { ...current, ...updates }
        return profileStorage.save(updated)
    },

    // Clear all profile data
    clear: (): boolean => {
        if (typeof window === 'undefined') return false
        
        try {
            localStorage.removeItem(STORAGE_KEY)
            return true
        } catch (error) {
            console.error('Error clearing profile data:', error)
            return false
        }
    }
}

// In a real app, you would have API functions like this:
/*
export const profileAPI = {
    async getProfile(userId: string): Promise<ProfileData> {
        const response = await fetch(`/api/profile/${userId}`)
        return response.json()
    },

    async updateProfile(userId: string, data: Partial<ProfileData>): Promise<ProfileData> {
        const response = await fetch(`/api/profile/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return response.json()
    }
}
*/
