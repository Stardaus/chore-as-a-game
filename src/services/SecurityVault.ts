/**
 * SecurityVault
 * 
 * Deep module encapsulating Parent PIN verification, security question validation,
 * and randomized adult recovery challenge generation behind a pure interface.
 */
export interface MathChallenge {
    text: string;
    answer: number;
}

export const SecurityVault = {
    /**
     * Verify if entered PIN matches the target PIN.
     */
    verifyPin: (inputPin: string, targetPin: string): boolean => {
        if (!inputPin || !targetPin) return false;
        return inputPin.trim() === targetPin.trim();
    },

    /**
     * Generate a randomized math problem to prove adult identity.
     */
    generateMathChallenge: (): MathChallenge => {
        const num1 = Math.floor(Math.random() * 90) + 10; // 10..99
        const num2 = Math.floor(Math.random() * 10) + 10;  // 10..19
        const num3 = Math.floor(Math.random() * 400) + 100; // 100..499
        
        return {
            text: `${num1} × ${num2} + ${num3}`,
            answer: (num1 * num2) + num3
        };
    },

    /**
     * Verify user response against expected math challenge answer.
     */
    verifyChallengeAnswer: (inputAnswer: string, expectedAnswer: number): boolean => {
        const parsed = parseInt(inputAnswer.trim(), 10);
        return !isNaN(parsed) && parsed === expectedAnswer;
    },

    /**
     * Verify user answer against target security question answer (case-insensitive).
     */
    verifySecurityQuestion: (inputAnswer: string, targetAnswer: string): boolean => {
        if (!inputAnswer || !targetAnswer) return false;
        return inputAnswer.trim().toLowerCase() === targetAnswer.trim().toLowerCase();
    }
};
