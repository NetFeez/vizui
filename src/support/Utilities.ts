/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description General-purpose utilities.
 * @license Apache-2.0
 */

export class Utilities {
    /**
     * Create a debounced function to prevent multiple calls in a short period of time.
     * @param func - The function to debounce.
     * @param delay - The delay in milliseconds.
     * @returns The debounced function.
     */
    public static debounce<FN extends Utilities.debounceFunction>(func: FN, delay: number = 500): Utilities.debounceResult<FN> {
        let timeOutID: number | undefined;
        function debounced(...args: Parameters<FN>): void {
            if (timeOutID) clearTimeout(timeOutID);
            function timeOut(): void {
                func(...args);
                clearTimeout(timeOutID);
            }
            timeOutID = setTimeout(timeOut, delay);
        }
        return debounced;
    }
}

export namespace Utilities {
    /** The signature a debounced function accepts. **/
    export type debounceFunction = (...args: any) => void;

    /** The debounced result, preserving the parameter types of the source function. **/
    export type debounceResult<FN extends debounceFunction> = (...args: Parameters<FN>) => void;
}

export default Utilities;