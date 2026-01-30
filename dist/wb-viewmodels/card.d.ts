/**
 * Card Behavior + Variants
 * -----------------------------------------------------------------------------
 * Comprehensive card system supporting various content types and layouts.
 * Handles extensive variants like heroes, profiles, pricing, and media cards.
 *
 * Usage:
 *   <wb-card variant="glass" title="Title">Content</wb-card>
 *   <wb-cardhero variant="cosmic" title="Hero Title" ...></wb-cardhero>
 * -----------------------------------------------------------------------------
 *
 * ARCHITECTURE:
 * - All card variants INHERIT from cardBase
 * - Variants CONTAIN specialized content (images, profiles, etc.)
 * - Changes to cardBase propagate to ALL variants automatically
 *
 * INHERITANCE: cardimage IS-A card
 * CONTAINMENT: cardimage HAS-A image (figure element)
 *
 * SEMANTIC STANDARD (MANDATORY):
 * - Container: <article> (preferred) or <section>
 * - Header content (title, subtitle): <header>
 * - Main content: <main>
 * - Footer content (actions, buttons): <footer>
 *
 * ALL text elements are EDITABLE via double-click in the builder
 */
/**
 * Base Card
 * All variants inherit from this
 */
export declare function cardBase(element: any, options?: any): {
    element: any;
    config: any;
    header: any;
    main: any;
    footer: any;
    CARD_PADDING: string;
    /**
     * Create a header section with title and optional subtitle
     * ALWAYS renders title/subtitle if provided in config
     */
    createHeader: (extraContent?: string) => HTMLElement;
    /**
     * Create the main content area
     */
    createMain: (content?: string) => HTMLElement;
    /**
     * Create footer section
     */
    createFooter: (content?: string) => HTMLElement;
    /**
     * Create a figure element for images/media
     */
    createFigure: () => HTMLElement;
    /**
     * Build the complete card structure
     * Call this from variants to get header + main + footer
     */
    buildStructure: (options?: any) => {
        header: any;
        main: any;
        footer: any;
    };
    cleanup: () => void;
};
/**
 * Card Component
 * Custom Tag: <wb-card>
 */
export declare function card(element: any, options?: any): () => void;
/**
 * Card Image Component
 * Custom Tag: <card-image>
 */
export declare function cardimage(element: any, options?: any): () => void;
/**
 * Card Video Component
 * Custom Tag: <card-video>
 */
export declare function cardvideo(element: any, options?: any): () => void;
/**
 * Card Button Component
 * Custom Tag: <card-button>
 */
export declare function cardbutton(element: any, options?: any): () => void;
/**
 * Card Hero Component
 * Custom Tag: <card-hero>
 */
export declare function cardhero(element: any, options?: any): () => void;
/**
 * Card Profile Component
 * Custom Tag: <card-profile>
 */
export declare function cardprofile(element: any, options?: any): () => void;
/**
 * Card Pricing Component
 * Custom Tag: <card-pricing>
 */
export declare function cardpricing(element: any, options?: any): () => void;
/**
 * Card Stats Component
 * Custom Tag: <card-stats>
 */
export declare function cardstats(element: any, options?: any): () => void;
/**
 * Card Testimonial Component
 * Custom Tag: <card-testimonial>
 */
export declare function cardtestimonial(element: any, options?: any): () => void;
/**
 * Card Product Component
 * Custom Tag: <card-product>
 */
export declare function cardproduct(element: any, options?: any): () => void;
/**
 * Card Notification Component
 * Custom Tag: <card-notification>
 */
export declare function cardnotification(element: any, options?: any): () => void;
/**
 * Card File Component
 * Custom Tag: <card-file>
 */
export declare function cardfile(element: any, options?: any): () => void;
/**
 * Card Link Component
 * Custom Tag: <card-link>
 */
export declare function cardlink(element: any, options?: any): () => void;
/**
 * Card Horizontal Component
 * Custom Tag: <card-horizontal>
 */
export declare function cardhorizontal(element: any, options?: any): () => void;
/**
 * Card Overlay Component
 * Custom Tag: <card-overlay>
 */
export declare function cardoverlay(element: any, options?: any): () => void;
/**
 * Card Expandable Component
 * Custom Tag: <card-expandable>
 */
export declare function cardexpandable(element: any, options?: any): () => void;
/**
 * Card Minimizable Component
 * Custom Tag: <card-minimizable>
 */
export declare function cardminimizable(element: any, options?: any): () => void;
/**
 * Card Draggable Component
 * Custom Tag: <card-draggable>
 */
export declare function carddraggable(element: any, options?: any): () => void;
export declare function cardportfolio(element: any, options?: any): () => void;
export declare const CARD_TYPES: string[];
export default card;
//# sourceMappingURL=card.d.ts.map