/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description add ajax utilities to vizui.
 * @module vizui
 * @license Apache-2.0
 */
export declare namespace Ajax {
    type method = 'GET' | 'POST' | 'PUT' | 'DELETE';
    interface toFormData {
        [key: string]: string | File;
    }
}
export declare class Ajax {
    /**
     * perform a ajax request to the given url.
     * @param url the url to perform the request.
     * @param method the http method to use.
     * @param data the data to send with the request.
     * @returns a promise that resolves with the response text.
     */
    static query(url: string, method?: Ajax.method, data?: Ajax.toFormData): Promise<string>;
    /**
     * convert a object to a FormData object.
     * @param data the object to convert.
     * @returns a FormData object.
     */
    static formData(data: Ajax.toFormData): FormData;
}
export default Ajax;
