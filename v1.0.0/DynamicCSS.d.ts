export declare class DynamicCSS {
    private static cache;
    /**
     * Loads an external css file.
     * @param url - The url of the css file.
     * @returns A promise that resolves when the css file is loaded.
     */
    static load(url: string): Promise<boolean>;
    /**
     * Checks if an external css file is already loaded.
     * @param url - The url of the css file.
     * @returns A promise that resolves when the css file is loaded.
     */
    private static checkCacheOrDOM;
    /**
     * Handler load success.
     * @param url - The url of the css file.
     * @param resolve - The resolve function.
     */
    private static loadHandler;
    /**
     * Handle load failure.
     * @param url - The url of the css file.
     * @param resolve - The resolve function.
     */
    private static errorHandler;
}
export declare namespace DynamicCSS {
    type resolve = (result: boolean) => void;
}
export default DynamicCSS;
