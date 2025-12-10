(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Workspace/dev-projects/sonash-v0/lib/firestore-service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FirestoreService",
    ()=>FirestoreService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/lib/firebase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$firebase$40$12$2e$6$2e$0$2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/firebase@12.6.0/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/@firebase+firestore@4.9.2_@firebase+app@0.14.6/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
;
;
const FirestoreService = {
    // Save or update a daily log entry
    async saveDailyLog (userId, data) {
        // Generate today's date string as ID (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], `users/${userId}/daily_logs/${today}`);
        // Merge true allows us to update fields independently (e.g., autosave journal separate from check-in)
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setDoc"])(docRef, {
            ...data,
            id: today,
            updatedAt: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Timestamp"].now()
        }, {
            merge: true
        });
    },
    // Get today's log if it exists
    async getTodayLog (userId) {
        const today = new Date().toISOString().split('T')[0];
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], `users/${userId}/daily_logs/${today}`);
        const docSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDoc"])(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    },
    // Get history of logs
    async getHistory (userId) {
        const logsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], `users/${userId}/daily_logs`);
        const q = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["query"])(logsRef, (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["orderBy"])("id", "desc"), (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["limit"])(30));
        const querySnapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f40$firebase$2b$firestore$40$4$2e$9$2e$2_$40$firebase$2b$app$40$0$2e$14$2e$6$2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDocs"])(q);
        return querySnapshot.docs.map((doc)=>({
                ...doc.data(),
                id: doc.id
            }));
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HistoryPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$providers$2f$auth$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/providers/auth-provider.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$lib$2f$firestore$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/lib/firestore-service.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function HistoryPage() {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$providers$2f$auth$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [entries, setEntries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [expandedId, setExpandedId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HistoryPage.useEffect": ()=>{
            if (user) {
                __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$lib$2f$firestore$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FirestoreService"].getHistory(user.uid).then({
                    "HistoryPage.useEffect": (data)=>{
                        setEntries(data);
                    }
                }["HistoryPage.useEffect"]);
            }
        }
    }["HistoryPage.useEffect"], [
        user
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-[#f5f0e6] p-4 font-sans text-amber-900",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-md mx-auto mb-8 pt-4 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "font-heading text-2xl",
                        children: "My Journal"
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                        lineNumber: 37,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "text-sm font-body underline decoration-amber-900/30 hover:text-amber-700",
                        children: "Back to Book"
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                        lineNumber: 38,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                lineNumber: 36,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-md mx-auto space-y-4",
                children: entries.map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        layout: true,
                        initial: {
                            opacity: 0,
                            y: 10
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        className: `
              bg-white/50 backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-shadow
              ${expandedId === entry.id ? 'shadow-md ring-1 ring-amber-200' : 'shadow-sm hover:shadow-md'}
            `,
                        onClick: ()=>setExpandedId(expandedId === entry.id ? null : entry.id),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-heading text-lg",
                                        children: entry.date
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                        lineNumber: 62,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            entry.used && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full",
                                                children: "RELAPSE"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                                lineNumber: 65,
                                                columnNumber: 37
                                            }, this),
                                            entry.cravings && !entry.used && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full",
                                                children: "CRAVING"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                                lineNumber: 70,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xl",
                                                children: entry.mood
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                                lineNumber: 74,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                        lineNumber: 63,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                lineNumber: 61,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                children: expandedId === entry.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        height: 0,
                                        opacity: 0
                                    },
                                    animate: {
                                        height: "auto",
                                        opacity: 1
                                    },
                                    exit: {
                                        height: 0,
                                        opacity: 0
                                    },
                                    className: "overflow-hidden",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pt-3 border-t border-amber-900/10",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-handwriting text-xl leading-relaxed whitespace-pre-wrap text-blue-900/80",
                                            style: {
                                                fontFamily: 'var(--font-caveat)'
                                            },
                                            children: entry.content
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                            lineNumber: 88,
                                            columnNumber: 41
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                        lineNumber: 87,
                                        columnNumber: 37
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                    lineNumber: 81,
                                    columnNumber: 33
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                lineNumber: 79,
                                columnNumber: 25
                            }, this),
                            expandedId !== entry.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-handwriting text-lg text-amber-900/40 truncate",
                                style: {
                                    fontFamily: 'var(--font-caveat)'
                                },
                                children: entry.content
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                                lineNumber: 99,
                                columnNumber: 29
                            }, this)
                        ]
                    }, entry.id, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                        lineNumber: 49,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
                lineNumber: 47,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/history/page.tsx",
        lineNumber: 34,
        columnNumber: 9
    }, this);
}
_s(HistoryPage, "iZbLkCzii3rtwcrm3xg5yZLji5s=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$providers$2f$auth$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = HistoryPage;
var _c;
__turbopack_context__.k.register(_c, "HistoryPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Workspace_dev-projects_sonash-v0_b331289b._.js.map