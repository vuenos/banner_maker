import { useCallback, useEffect, useRef, useState } from "react";
import {
    Banner,
    DEFAULT_BANNER,
    HISTORY_LIMIT,
    bannersEqual,
    loadDraft,
    randomHex,
    randomPhrase,
    sanitize,
    saveDraft,
} from "./bannerModel";

function createInitialBanner() {
    return (
        loadDraft() ??
        sanitize({
            ...DEFAULT_BANNER,
            backgroundColor: randomHex(),
            text: randomPhrase(),
        })
    );
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

    const commit = useCallback(
        (partial: Partial<Banner>) => {
            const current = bannerRef.current;
            const next = sanitize({ ...current, ...partial });
            gestureBase.current = null;
            if (bannersEqual(current, next)) return;
            past.current.push(current);
            if (past.current.length > HISTORY_LIMIT) past.current.shift();
            future.current = [];
            bannerRef.current = next;
            setBanner(next);
            syncHistory();
        },
        [syncHistory],
    );

    const live = useCallback((partial: Partial<Banner>) => {
        const current = bannerRef.current;
        if (!gestureBase.current) gestureBase.current = current;
        const next = sanitize({ ...current, ...partial });
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

    useEffect(() => {
        const timer = window.setTimeout(() => saveDraft(banner), 300);
        return () => window.clearTimeout(timer);
    }, [banner]);

    return {
        banner,
        commit,
        live,
        endGesture,
        undo,
        redo,
        canUndo: history.undo > 0,
        canRedo: history.redo > 0,
    };
}
