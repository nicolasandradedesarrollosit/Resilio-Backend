export function validateFieldsBusinessLogIn(email, password) {
    if (!email || !password) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    if (password.length < 8 || password.length > 72) return false;
    
    return true;
}
