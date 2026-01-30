/**
 * Media Behaviors
 * -----------------------------------------------------------------------------
 * Collection of behaviors for enhanced media elements including images,
 * video players, audio players, and galleries.
 *
 * Custom Tag: <wb-media>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <img x-image data-zoomable src="...">
 *   <wb-video  data-src="..."></div>
 */
/**
 * Image - Enhanced images
 * Helper Attribute: [x-image]
 */
export declare function image(element: any, options?: any): () => any;
/**
 * Gallery - Image gallery
 * Custom Tag: <wb-gallery>
 */
export declare function gallery(element: any, options?: any): () => any;
/**
 * Video - Enhanced video player
 * Custom Tag: <wb-video>
 */
export declare function video(element: any, options?: any): () => any;
/**
 * Audio - Enhanced audio player with 15-BAND GRAPHIC EQUALIZER
 * Custom Tag: <wb-audio>
 * Premium plastic slider design with 3D appearance
 */
export declare function audio(element: any, options?: any): () => void;
/**
 * Custom Tag: <wb-youtube>
 * YouTube - YouTube embed
 */
export declare function youtube(element: any, options?: any): () => any;
/**
 * Custom Tag: <wb-vimeo>
 * Vimeo - Vimeo embed
 */
export declare function vimeo(element: any, options?: any): () => any;
export declare function ratio(element: any, options?: any): () => void;
export declare function figure(element: any, options?: any): () => void;
declare const img: typeof image;
declare const aspectratio: typeof ratio;
export { img, aspectratio };
declare const _default: {
    image: typeof image;
    gallery: typeof gallery;
    video: typeof video;
    audio: typeof audio;
    youtube: typeof youtube;
    vimeo: typeof vimeo;
    ratio: typeof ratio;
    figure: typeof figure;
    img: typeof image;
    aspectratio: typeof ratio;
};
export default _default;
//# sourceMappingURL=media.d.ts.map