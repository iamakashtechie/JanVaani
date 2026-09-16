/**
 * Validates the Report Issue form fields.
 * Exact map coordinates selection is mandatory.
 * @returns {Object} errors - keyed by field name
 */
export const validateIssueForm = ({ title, category, description, location, coordinates }) => {
    const errors = {};

    if (!title || title.trim().length < 5)
        errors.title = 'Title must be at least 5 characters.';
    else if (title.trim().length > 100)
        errors.title = 'Title must be under 100 characters.';

    if (!category)
        errors.category = 'Please select an issue category.';

    if (!description || description.trim().length < 20)
        errors.description = 'Description must be at least 20 characters.';
    else if (description.trim().length > 500)
        errors.description = 'Description must be under 500 characters.';

    if (!location || location.trim().length < 3)
        errors.location = 'Please enter a street name or area landmark.';

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        errors.coordinates = 'Map location selection is compulsory. Please click on the map or use Auto-GPS to pin the exact spot.';
    }

    return errors;
};

/**
 * Validates password strength.
 * @returns {{ score: number, label: string, color: string }}
 */
export const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
        { score: 0, label: '',        color: 'bg-gray-200' },
        { score: 1, label: 'Weak',    color: 'bg-red-400' },
        { score: 2, label: 'Fair',    color: 'bg-orange-400' },
        { score: 3, label: 'Good',    color: 'bg-yellow-400' },
        { score: 4, label: 'Strong',  color: 'bg-green-500' },
    ];
    return levels[score];
};
