export default class WBSite {
    config: any;
    currentPage: string;
    navCollapsed: boolean;
    mobileNavOpen: boolean;
    init(): Promise<void>;
    updateFavicon(): void;
    render(): void;
    renderHeader(): string;
    renderNav(): string;
    initResizableNav(): void;
    initStickyHeader(): void;
    renderFooter(): string;
    renderPage(pageId: any): string;
    navigateTo(pageId: any): Promise<void>;
    render404(pageId: any): string;
    updateActiveNav(): void;
    toggleNav(): void;
    closeMobileNav(): void;
}
//# sourceMappingURL=site-engine.d.ts.map