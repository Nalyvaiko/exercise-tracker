export const getValidDate = (dateInput) => {
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateInput || !isoPattern.test(dateInput)) {
        return new Date();
    }

    return new Date(dateInput);
};
