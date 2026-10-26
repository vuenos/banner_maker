import { useCallback, useEffect, useRef, useState } from "react";
import {
    Banner,
    HISTORY_LIMIT,
    TextLayer,
    addTextLayer,
    bannersEqual,
    createFreshBanner,
    loadDraft,
    removeTextLayer,
    sanitize,
    saveDraft,
    selectedText,
    withSelectedText,
} from "./bannerModel";

function createInitialBanner() {
    return loadDraft() ?? createFreshBanner();
}

export function useBannerState() {
    const [banner, setBanner] = useState<Banner>(createInitialBanner);
    const bannerRef = useRef(banner);
    const past = useRef<Banner[]>([]);
    const future = useRef<Banner[]>([]);
    const gestureBase = useRef<Banner | null>(null);
    const [history, setHistory] = useState({ undo: 0, redo: 0 });

    const syncHistory = useCallback(() => {
        setHistory({
            undo: past.current.length,
            redo: future.current.length,
        });
    }, []);

    const apply = useCallback(
        (next: Banner, recordHistory: boolean) => {
            const current = bannerRef.current;
            const safe = sanitize(next);
            if (bannersEqual(current, safe)) return;
            if (recordHistory) {
                past.current.push(current);
                if (past.current.length > HISTORY_LIMIT) past.current.shift();
                future.current = [];
                syncHistory();
            }
            bannerRef.current = safe;
            setBanner(safe);
        },
        [syncHistory],
    );

    const commit = useCallback(
        (partial: Partial<Banner>) => {
            gestureBase.current = null;
            apply({ ...bannerRef.current, ...partial }, true);
        },
        [apply],
    );

    const commitText = useCallback(
        (partial: Partial<TextLayer>) => {
            gestureBase.current = null;
            apply(withSelectedText(bannerRef.current, partial), true);
        },
        [apply],
    );

    const live = useCallback((partial: Partial<Banner>) => {
        const current = bannerRef.current;
        if (!gestureBase.current) gestureBase.current = current;
        const next = sanitize({ ...current, ...partial });
        bannerRef.current = next;
        setBanner(next);
    }, []);

    const liveText = useCallback((partial: Partial<TextLayer>) => {
        const current = bannerRef.current;
        if (!gestureBase.current) gestureBase.current = current;
        const next = sanitize(withSelectedText(current, partial));
        bannerRef.current = next;
        setBanner(next);
    }, []);

    const endGesture = useCallback(() => {
        const base = gestureBase.current;
        gestureBase.current = null;
        if (!base || bannersEqual(base, bannerRef.current)) return;
        past.current.push(base);
        if (past.current.length > HISTORY_LIMIT) past.current.shift();
        future.current = [];
        syncHistory();
    }, [syncHistory]);

    const undo = useCallback(() => {
        const previous = past.current.pop();
        if (!previous) return;
        gestureBase.current = null;
        future.current.push(bannerRef.current);
        bannerRef.current = previous;
        setBanner(previous);
        syncHistory();
    }, [syncHistory]);

    const redo = useCallback(() => {
        const next = future.current.pop();
        if (!next) return;
        gestureBase.current = null;
        past.current.push(bannerRef.current);
        bannerRef.current = next;
        setBanner(next);
        syncHistory();
    }, [syncHistory]);

    const addText = useCallback(() => {
        gestureBase.current = null;
        apply(addTextLayer(bannerRef.current), true);
    }, [apply]);

    const removeText = useCallback(
        (id?: string) => {
            gestureBase.current = null;
            const target = id ?? bannerRef.current.selectedId;
            apply(removeTextLayer(bannerRef.current, target), true);
        },
        [apply],
    );

    const selectText = useCallback((id: string) => {
        if (bannerRef.current.selectedId === id) return;
        gestureBase.current = null;
        apply({ ...bannerRef.current, selectedId: id }, false);
    }, [apply]);

    const reset = useCallback(() => {
        gestureBase.current = null;
        past.current = [];
        future.current = [];
        const fresh = createFreshBanner();
        bannerRef.current = fresh;
        setBanner(fresh);
        syncHistory();
    }, [syncHistory]);

    useEffect(() => {
        const timer = window.setTimeout(() => saveDraft(banner), 300);
        return () => window.clearTimeout(timer);
    }, [banner]);

    return {
        banner,
        selected: selectedText(banner),
        commit,
        commitText,
        live,
        liveText,
        endGesture,
        undo,
        redo,
        reset,
        addText,
        removeText,
        selectText,
        canUndo: history.undo > 0,
        canRedo: history.redo > 0,
    };
}
