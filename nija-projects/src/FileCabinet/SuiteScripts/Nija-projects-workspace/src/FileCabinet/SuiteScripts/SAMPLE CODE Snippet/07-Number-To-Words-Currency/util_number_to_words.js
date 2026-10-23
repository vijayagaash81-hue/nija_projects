/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * 
 * Scenario: Number to Words Currency Conversion Utility
 * Purpose: Reusable AMD module for converting numeric currency amounts into formal English words.
 *          Supports UAE Dirhams (AED / Fils), US Dollars (USD / Cents), and generic currencies.
 */
define([], () => {

    const ONES = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'
    ];

    const TENS = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    /**
     * Converts a number between 0 and 999 to English words
     * @param {number} num
     * @returns {string}
     */
    function convertThreeDigits(num) {
        let current = '';

        if (num >= 100) {
            current += ONES[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }

        if (num >= 20) {
            current += TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ONES[num % 10] : '') + ' ';
        } else if (num > 0) {
            current += ONES[num] + ' ';
        }

        return current.trim();
    }

    /**
     * Converts an integer to words
     * @param {number} integerPart
     * @returns {string}
     */
    function convertIntegerToWords(integerPart) {
        if (integerPart === 0) return 'Zero';

        let words = '';
        let scaleIndex = 0;

        while (integerPart > 0) {
            const chunk = integerPart % 1000;
            if (chunk !== 0) {
                const chunkStr = convertThreeDigits(chunk);
                const scaleStr = SCALES[scaleIndex];
                words = chunkStr + (scaleStr ? ' ' + scaleStr : '') + (words ? ' ' + words : '');
            }
            integerPart = Math.floor(integerPart / 1000);
            scaleIndex++;
        }

        return words.trim();
    }

    /**
     * Main Function: Converts amount to formatted currency words
     * @param {number|string} amount - e.g. 15420.50
     * @param {string} mainCurrency - e.g. 'Dirhams', 'Dollars'
     * @param {string} subCurrency - e.g. 'Fils', 'Cents'
     * @returns {string} e.g. "Fifteen Thousand Four Hundred Twenty Dirhams and Fifty Fils Only"
     */
    function toCurrencyWords(amount, mainCurrency = 'Dirhams', subCurrency = 'Fils') {
        const num = parseFloat(amount);
        if (isNaN(num)) return '';

        const absNum = Math.abs(num);
        const integerPart = Math.floor(absNum);
        const decimalPart = Math.round((absNum - integerPart) * 100);

        let result = convertIntegerToWords(integerPart) + ' ' + mainCurrency;

        if (decimalPart > 0) {
            result += ' and ' + convertIntegerToWords(decimalPart) + ' ' + subCurrency;
        }

        return result + ' Only';
    }

    return {
        toCurrencyWords: toCurrencyWords,
        convertIntegerToWords: convertIntegerToWords
    };
});
