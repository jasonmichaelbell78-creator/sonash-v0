(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BookCover
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function BookCover({ onOpen, isAnimating = false, nickname = "Friend", cleanDays = 0 }) {
    _s();
    const [viewportWidth, setViewportWidth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookCover.useEffect": ()=>{
            setViewportWidth(window.innerWidth);
        }
    }["BookCover.useEffect"], []);
    const isMobile = viewportWidth > 0 && viewportWidth < 768;
    const bookWidth = isMobile ? Math.min(viewportWidth * 0.9, 600) : 600;
    const bookHeight = isMobile ? bookWidth * 1.42 : 850;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative cursor-pointer flex items-center justify-center",
        onClick: onOpen,
        style: {
            perspective: "2000px"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "absolute -bottom-8 left-1/2",
                style: {
                    width: "90%",
                    height: "64px",
                    background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)",
                    filter: "blur(20px)",
                    transform: "translateX(-50%) scaleY(0.4)"
                },
                animate: isAnimating ? {
                    opacity: 0.3
                } : {
                    opacity: 1
                },
                transition: {
                    duration: 0.8
                }
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "absolute",
                style: {
                    width: bookWidth,
                    height: bookHeight,
                    background: `linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #e5dfd3 100%)`,
                    borderRadius: "8px",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)"
                },
                initial: {
                    opacity: 0
                },
                animate: isAnimating ? {
                    opacity: 1
                } : {
                    opacity: 0
                },
                transition: {
                    duration: 0.3,
                    delay: 0.2
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 opacity-30 rounded-lg",
                        style: {
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' opacity='0.4'/%3E%3C/svg%3E")`
                        }
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 p-8 pointer-events-none overflow-hidden rounded-lg",
                        children: [
                            ...Array(30)
                        ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full h-px bg-sky-200/20",
                                style: {
                                    marginBottom: "24px"
                                }
                            }, i, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                lineNumber: 71,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "relative",
                style: {
                    width: bookWidth,
                    height: bookHeight,
                    transformStyle: "preserve-3d",
                    transformOrigin: "left center"
                },
                initial: {
                    rotateY: 0
                },
                animate: isAnimating ? {
                    rotateY: -160,
                    x: -50
                } : {
                    rotateY: 0,
                    x: 0
                },
                transition: {
                    duration: 1.2,
                    ease: [
                        0.4,
                        0,
                        0.2,
                        1
                    ]
                },
                whileHover: !isAnimating ? {
                    scale: 1.02,
                    y: -8
                } : {},
                whileTap: !isAnimating ? {
                    scale: 0.98
                } : {},
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        src: "/images/notebook-cover-blank.png",
                        alt: "SoNash Recovery Notebook",
                        fill: true,
                        className: "object-cover rounded-lg",
                        style: {
                            filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
                            backfaceVisibility: "hidden"
                        },
                        priority: true
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        className: "absolute flex flex-col items-center pointer-events-none",
                        style: {
                            top: "12%",
                            bottom: "12%",
                            left: "18%",
                            right: "18%",
                            backfaceVisibility: "hidden"
                        },
                        animate: isAnimating ? {
                            opacity: 0
                        } : {
                            opacity: 1
                        },
                        transition: {
                            duration: 0.3
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "font-rocksalt leading-tight text-center text-2xl md:text-3xl",
                                        style: {
                                            color: "#e0d8cc",
                                            textShadow: `
                  1px 1px 0px rgba(0,0,0,0.7),
                  2px 2px 3px rgba(0,0,0,0.5),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `
                                        },
                                        children: "SoNash"
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                        lineNumber: 120,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-shortstack tracking-wide mt-1 text-base md:text-lg",
                                        style: {
                                            color: "#d4ccc0",
                                            textShadow: `
                  1px 1px 0px rgba(0,0,0,0.6),
                  2px 2px 2px rgba(0,0,0,0.4),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `
                                        },
                                        children: "Sober Nashville"
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                        lineNumber: 134,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center mt-auto",
                                style: {
                                    marginLeft: "-1%"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "font-rocksalt leading-relaxed text-center text-lg md:text-xl",
                                    style: {
                                        color: "#e0d8cc",
                                        textShadow: `
                  1px 1px 0px rgba(0,0,0,0.7),
                  2px 2px 3px rgba(0,0,0,0.5),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `
                                    },
                                    children: [
                                        nickname,
                                        "'s",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                            lineNumber: 163,
                                            columnNumber: 15
                                        }, this),
                                        "Recovery Notebook"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                    lineNumber: 151,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center mt-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-shortstack text-center leading-snug text-sm md:text-base",
                                    style: {
                                        color: "#d4ccc0",
                                        textShadow: `
                  1px 1px 0px rgba(0,0,0,0.6),
                  2px 2px 2px rgba(0,0,0,0.4),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `
                                    },
                                    children: [
                                        "You've been clean",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                            lineNumber: 182,
                                            columnNumber: 15
                                        }, this),
                                        "for ",
                                        cleanDays,
                                        " days."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                    lineNumber: 170,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                lineNumber: 169,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mt-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-shortstack text-xs md:text-sm",
                                    style: {
                                        color: "#d4ccc0",
                                        textShadow: `
                  1px 1px 0px rgba(0,0,0,0.6),
                  2px 2px 2px rgba(0,0,0,0.4),
                  -1px -1px 0px rgba(255,255,255,0.2)
                `
                                    },
                                    children: "Turn to Today's Page →"
                                }, void 0, false, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                    lineNumber: 189,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 rounded-lg",
                        style: {
                            background: `linear-gradient(135deg, #3c6473 0%, #4a7585 50%, #3a5f6d 100%)`,
                            transform: "rotateY(180deg)",
                            backfaceVisibility: "hidden"
                        }
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(BookCover, "5gcFGkdbjMzlqbC2Ip62YSNdeuo=");
_c = BookCover;
var _c;
__turbopack_context__.k.register(_c, "BookCover");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/tab-navigation.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TabNavigation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
"use client";
;
;
function TabNavigation({ tabs, activeTab, onTabChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute right-0 top-8 bottom-8 w-8 md:w-10 flex flex-col justify-start gap-1 z-30 translate-x-full",
        children: [
            tabs.map((tab, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
                    onClick: ()=>onTabChange(tab.id),
                    className: `
            relative h-16 md:h-20 w-10 md:w-12 rounded-r-lg
            ${tab.color}
            ${activeTab === tab.id ? "w-12 md:w-14" : ""}
            transition-all duration-200
            hover:w-12 md:hover:w-14
          `,
                    style: {
                        boxShadow: activeTab === tab.id ? "2px 2px 8px rgba(0,0,0,0.2)" : "1px 1px 4px rgba(0,0,0,0.1)",
                        writingMode: "vertical-rl",
                        textOrientation: "mixed"
                    },
                    whileHover: {
                        x: 4
                    },
                    whileTap: {
                        scale: 0.95
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-body text-xs md:text-sm text-amber-900/70 rotate-180 block",
                            style: {
                                transform: "rotate(180deg)"
                            },
                            children: tab.label
                        }, void 0, false, {
                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/tab-navigation.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/10 to-transparent"
                        }, void 0, false, {
                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/tab-navigation.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this)
                    ]
                }, tab.id, true, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/tab-navigation.tsx",
                    lineNumber: 21,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-h-8"
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/tab-navigation.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/tab-navigation.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c = TabNavigation;
var _c;
__turbopack_context__.k.register(_c, "TabNavigation");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/bookmark-ribbon.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BookmarkRibbon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
"use client";
;
;
;
function BookmarkRibbon({ onClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
        onClick: onClick,
        className: "absolute top-0 right-16 md:right-24 z-40 w-8 md:w-10 cursor-pointer",
        whileHover: {
            y: 4
        },
        whileTap: {
            scale: 0.95
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-full bg-sky-300 rounded-b-sm",
            style: {
                height: "60px",
                clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
                boxShadow: "2px 4px 8px rgba(0,0,0,0.2)"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/bookmark-ribbon.tsx",
                    lineNumber: 28,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-x-0 top-3 flex justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                        className: "w-4 h-4 md:w-5 md:h-5 text-sky-700"
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/bookmark-ribbon.tsx",
                        lineNumber: 32,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/bookmark-ribbon.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/bookmark-ribbon.tsx",
            lineNumber: 19,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/bookmark-ribbon.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = BookmarkRibbon;
var _c;
__turbopack_context__.k.register(_c, "BookmarkRibbon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StickyNote
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
"use client";
;
;
;
function StickyNote({ title, onClose, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/20",
        initial: {
            opacity: 0
        },
        animate: {
            opacity: 1
        },
        exit: {
            opacity: 0
        },
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
            className: "relative w-[280px] md:w-[320px] bg-amber-50 rounded-sm p-6 cursor-default",
            style: {
                boxShadow: `
            4px 4px 12px rgba(0,0,0,0.3),
            0 0 0 1px rgba(0,0,0,0.05)
          `,
                transform: "rotate(-2deg)",
                background: "linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%)"
            },
            initial: {
                scale: 0.8,
                opacity: 0,
                rotate: -10
            },
            animate: {
                scale: 1,
                opacity: 1,
                rotate: -2
            },
            exit: {
                scale: 0.8,
                opacity: 0,
                rotate: 10
            },
            transition: {
                type: "spring",
                damping: 20,
                stiffness: 300
            },
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-amber-100/80 rounded-sm",
                    style: {
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        transform: "translateX(-50%) rotate(1deg)"
                    }
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onClose,
                    className: "absolute top-2 right-2 text-amber-700/50 hover:text-amber-900 transition-colors",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                        className: "w-5 h-5"
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
                    lineNumber: 49,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "font-heading text-xl text-amber-900 underline mb-4",
                    children: title
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
                    lineNumber: 57,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "font-body text-amber-900/80",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
                    lineNumber: 60,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 opacity-20 pointer-events-none rounded-sm",
                    style: {
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`
                    }
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
                    lineNumber: 63,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
_c = StickyNote;
var _c;
__turbopack_context__.k.register(_c, "StickyNote");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TodayPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function TodayPage({ nickname }) {
    _s();
    const [mood, setMood] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [cravings, setCravings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [used, setUsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [selectedReading, setSelectedReading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("AA");
    const [journalEntry, setJournalEntry] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const { user } = useAuth();
    // Load saved data on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TodayPage.useEffect": ()=>{
            // Basic local restore first (fast)
            const savedEntry = localStorage.getItem("sonash_journal_temp");
            if (savedEntry) setJournalEntry(savedEntry);
            // Then try to fetch from cloud if user exists
            if (user) {
                FirestoreService.getTodayLog(user.uid).then({
                    "TodayPage.useEffect": (log)=>{
                        if (log) {
                            if (log.content) setJournalEntry(log.content);
                            if (log.mood) setMood(log.mood);
                            setCravings(log.cravings);
                            setUsed(log.used);
                        }
                    }
                }["TodayPage.useEffect"]);
            }
        }
    }["TodayPage.useEffect"], [
        user
    ]);
    // Auto-save effect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TodayPage.useEffect": ()=>{
            const timeoutId = setTimeout({
                "TodayPage.useEffect.timeoutId": ()=>{
                    // Always save locally first as backup
                    localStorage.setItem("sonash_journal_temp", journalEntry);
                    // Save to cloud if user is logged in
                    if (user) {
                        FirestoreService.saveDailyLog(user.uid, {
                            date: new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric"
                            }),
                            content: journalEntry,
                            mood: mood,
                            cravings: cravings,
                            used: used
                        });
                    }
                }
            }["TodayPage.useEffect.timeoutId"], 1000);
            return ({
                "TodayPage.useEffect": ()=>clearTimeout(timeoutId)
            })["TodayPage.useEffect"];
        }
    }["TodayPage.useEffect"], [
        journalEntry,
        mood,
        cravings,
        used,
        user
    ]);
    const today = new Date();
    const dateString = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
    });
    // We'll use the variable name defined in layout.tsx via CSS variable usually,
    // but to be safe and explicit with Tailwind using arbitrary values or the class if globally mapped.
    // Inspection of globals.css would confirm, but usually `font-caveat` works if configured.
    // Based on layout.tsx: variable: "--font-caveat".
    // So `font-[family-name:var(--font-caveat)]` is the Next.js way.
    const moods = [
        {
            id: "struggling",
            emoji: "😟",
            label: "Struggling",
            color: "text-red-500"
        },
        {
            id: "okay",
            emoji: "😐",
            label: "Okay",
            color: "text-orange-500"
        },
        {
            id: "hopeful",
            emoji: "🙂",
            label: "Hopeful",
            color: "text-lime-500"
        },
        {
            id: "great",
            emoji: "😊",
            label: "Great",
            color: "text-green-500"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full overflow-y-auto pr-2 pb-8 scrollbar-hide",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-body text-lg text-amber-900/80 underline decoration-amber-900/30",
                        children: [
                            dateString,
                            " – Hey ",
                            nickname,
                            ", one day at a time."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                        lineNumber: 81,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "/history",
                        className: "font-heading text-amber-900/60 hover:text-amber-900 text-sm border-b border-amber-900/30 hover:border-amber-900 transition-colors",
                        children: "My Journal →"
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "font-heading text-xl text-amber-900/90 mb-2",
                                        children: "Tracker – Clean time"
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-heading text-2xl md:text-3xl text-amber-900",
                                        children: "1 year · 2 months · 5 days"
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 96,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-body text-sm text-amber-900/60 mt-1",
                                        children: "... and 13 minutes so far today"
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 97,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-body text-sm text-amber-900/50 mt-2 flex items-center gap-1 cursor-pointer hover:text-amber-700 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "inline-block rotate-45",
                                                children: "↑"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 99,
                                                columnNumber: 15
                                            }, this),
                                            "Tap here if something happened today"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-4 mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "font-heading text-xl text-amber-900/90",
                                                children: "Today's Reading"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 107,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setSelectedReading("AA"),
                                                        className: `px-3 py-1 rounded-full font-body text-sm transition-all ${selectedReading === "AA" ? "bg-sky-300 text-sky-900 shadow-sm" : "bg-amber-100 text-amber-700"}`,
                                                        children: "AA"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 109,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setSelectedReading("NA"),
                                                        className: `px-3 py-1 rounded-full font-body text-sm transition-all ${selectedReading === "NA" ? "bg-amber-400 text-amber-900 shadow-sm" : "bg-amber-100 text-amber-700"}`,
                                                        children: "NA"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 116,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 108,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 106,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-amber-100 p-4 rounded-sm relative transition-transform hover:scale-[1.02] cursor-pointer",
                                        style: {
                                            boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
                                            transform: "rotate(-1deg)"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400/80 shadow-inner backdrop-blur-sm"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 134,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-heading text-lg text-amber-900 text-center mb-3 pt-2",
                                                children: "Serenity is found in the moment."
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 135,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "block mx-auto bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded font-body text-amber-900 text-sm transition-colors",
                                                children: "Open full reading"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 138,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 127,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                lineNumber: 105,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "font-heading text-xl text-amber-900/90 mb-3",
                                        children: "Check-In: How are you doing today?"
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 149,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between gap-2 mb-4",
                                        children: moods.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setMood(m.id),
                                                className: `flex flex-col items-center p-2 rounded-lg transition-all ${mood === m.id ? "bg-amber-100 scale-110 shadow-sm ring-1 ring-amber-200" : "hover:bg-amber-50"}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-2xl md:text-3xl filter drop-shadow-sm",
                                                        children: m.emoji
                                                    }, void 0, false, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 160,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-body text-xs text-amber-900/70 mt-1",
                                                        children: m.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 161,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, m.id, true, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 152,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 150,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3 pl-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-heading text-lg text-amber-900/80",
                                                        children: "Cravings?"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 169,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `font-body text-sm ${cravings ? "text-amber-900 font-bold" : "text-amber-900/40"}`,
                                                                children: "Yes"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                lineNumber: 171,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>setCravings(!cravings),
                                                                className: `w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-amber-300/50 ${cravings ? "bg-amber-400" : "bg-gray-300"}`,
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${cravings ? "translate-x-6" : "translate-x-0"}`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                    lineNumber: 177,
                                                                    columnNumber: 21
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                lineNumber: 172,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `font-body text-sm ${!cravings ? "text-amber-900 font-bold" : "text-amber-900/40"}`,
                                                                children: "No"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                lineNumber: 182,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 170,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 168,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-heading text-lg text-amber-900/80",
                                                        children: "Used?"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 187,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `font-body text-sm ${used ? "text-red-700 font-bold" : "text-amber-900/40"}`,
                                                                children: "Yes"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                lineNumber: 189,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>setUsed(!used),
                                                                className: `w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-red-300/50 ${used ? "bg-red-400" : "bg-gray-300"}`,
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${used ? "translate-x-6" : "translate-x-0"}`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                    lineNumber: 195,
                                                                    columnNumber: 21
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                lineNumber: 190,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `font-body text-sm ${!used ? "text-amber-900 font-bold" : "text-amber-900/40"}`,
                                                                children: "No"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                                lineNumber: 200,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                        lineNumber: 188,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 186,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 167,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                lineNumber: 148,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative group",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "font-heading text-lg text-amber-900/90 mb-2",
                                        children: "Anything you want to jot down?"
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 208,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative min-h-[200px] w-full",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                value: journalEntry,
                                                onChange: (e)=>setJournalEntry(e.target.value),
                                                placeholder: "Start writing here...",
                                                className: "w-full h-full min-h-[200px] bg-transparent resize-none focus:outline-none text-xl md:text-2xl text-blue-900/80 leading-[1.5em]",
                                                style: {
                                                    fontFamily: 'var(--font-caveat), cursive',
                                                    lineHeight: '22px' // Matches the background lines in notebook-shell roughly
                                                },
                                                spellCheck: false
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 212,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute -bottom-6 right-0 text-xs text-amber-900/40 font-body italic",
                                                children: journalEntry ? "Saved locally" : "Autosaves as you type"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                                lineNumber: 224,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                        lineNumber: 210,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                lineNumber: 207,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-body text-sm text-amber-900/50 text-right pt-4",
                                children: "Swipe left to go to the next section →"
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                                lineNumber: 231,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx",
        lineNumber: 78,
        columnNumber: 5
    }, this);
}
_s(TodayPage, "+S1+QrwK9+XejPSYnHn81KXct9s=", true);
_c = TodayPage;
var _c;
__turbopack_context__.k.register(_c, "TodayPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ResourcesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/map-pin.js [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Map$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/map.js [app-client] (ecmascript) <export default as Map>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
"use client";
;
;
function ResourcesPage() {
    const resources = [
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
            title: "Meeting Finder",
            description: "Find AA, NA, and support meetings by time and neighborhood."
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"],
            title: "Sober Living Finder",
            description: "Sober homes and halfway houses with basic info and contacts."
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Map$3e$__["Map"],
            title: "Local Resource Map",
            description: "Detox, rehabs, clinics, pharmacies, food, IDs, bus stations."
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"],
            title: "Nashville Sober Events",
            description: "Cookouts, game nights, sober concerts and more."
        }
    ];
    const meetings = [
        {
            time: "7:00 am",
            type: "AA",
            location: "East Nashville"
        },
        {
            time: "12:00 pm",
            type: "NA",
            location: "Downtown"
        },
        {
            time: "6:30 pm",
            type: "AA",
            location: "West End"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full overflow-y-auto pr-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "font-heading text-2xl text-amber-900 underline mb-4",
                children: "Resources – Getting around Nashville"
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: resources.map((resource, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "w-full text-left p-4 border border-amber-200/50 rounded-lg hover:bg-amber-50 transition-colors group",
                                style: {
                                    boxShadow: "1px 1px 4px rgba(0,0,0,0.05)"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(resource.icon, {
                                            className: "w-6 h-6 text-amber-700/70 mt-0.5 flex-shrink-0"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                            lineNumber: 49,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-heading text-lg text-amber-900 group-hover:underline",
                                                    children: resource.title
                                                }, void 0, false, {
                                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                    lineNumber: 51,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-body text-sm text-amber-900/60",
                                                    children: resource.description
                                                }, void 0, false, {
                                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                    lineNumber: 52,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                            lineNumber: 50,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                    lineNumber: 48,
                                    columnNumber: 15
                                }, this)
                            }, index, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-heading text-xl text-amber-900 mb-4",
                                children: "Meeting Finder – Today"
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative w-full h-40 mb-4 rounded-lg overflow-hidden border border-amber-200/50",
                                style: {
                                    background: "linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 100%)"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "absolute inset-0 w-full h-full",
                                        viewBox: "0 0 200 100",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M20,50 Q60,30 100,50 T180,50",
                                                stroke: "#9ca3af",
                                                strokeWidth: "2",
                                                fill: "none",
                                                strokeDasharray: "4,2"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                lineNumber: 73,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M50,20 Q70,50 50,80",
                                                stroke: "#9ca3af",
                                                strokeWidth: "2",
                                                fill: "none",
                                                strokeDasharray: "4,2"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                lineNumber: 80,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M100,10 L100,90",
                                                stroke: "#9ca3af",
                                                strokeWidth: "1.5",
                                                fill: "none",
                                                strokeDasharray: "3,2"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                lineNumber: 81,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M150,30 Q130,50 150,70",
                                                stroke: "#9ca3af",
                                                strokeWidth: "2",
                                                fill: "none",
                                                strokeDasharray: "4,2"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                lineNumber: 82,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M0,60 Q50,70 100,55 T200,65",
                                                stroke: "#93c5fd",
                                                strokeWidth: "4",
                                                fill: "none",
                                                opacity: "0.6"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                lineNumber: 85,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                        lineNumber: 71,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute top-6 left-16",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                            className: "w-5 h-5 text-amber-600 fill-amber-200"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                            lineNumber: 90,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                        lineNumber: 89,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute top-12 left-1/2 -translate-x-1/2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                            className: "w-5 h-5 text-amber-600 fill-amber-200"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                            lineNumber: 93,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                        lineNumber: 92,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute bottom-8 right-16",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                            className: "w-5 h-5 text-amber-600 fill-amber-200"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                            lineNumber: 96,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "sr-only",
                                            children: "Open full map"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                            lineNumber: 101,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                        lineNumber: 100,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: meetings.map((meeting, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "w-full text-left flex items-center gap-3 p-2 hover:bg-amber-50 rounded transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-4 h-4 border-2 border-amber-400 rounded-sm"
                                            }, void 0, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                lineNumber: 112,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-body text-amber-900",
                                                children: [
                                                    meeting.time,
                                                    " – ",
                                                    meeting.type,
                                                    " – ",
                                                    meeting.location
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                                lineNumber: 113,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                        lineNumber: 108,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                lineNumber: 106,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-body text-sm text-amber-900/50 mt-4 italic",
                                children: "Tap a meeting for details or directions."
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c = ResourcesPage;
var _c;
__turbopack_context__.k.register(_c, "ResourcesPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SupportPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/heart.js [app-client] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/lucide-react@0.454.0_react@19.2.0/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-client] (ecmascript) <export default as Briefcase>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function SupportPage() {
    _s();
    const [selectedContact, setSelectedContact] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const contacts = [
        {
            id: "1",
            name: "Jordan",
            role: "Sponsor",
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"],
            tags: [
                "good in a crisis",
                "just to talk"
            ]
        },
        {
            id: "2",
            name: "Maya",
            role: "Friend",
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"],
            tags: [
                "rides",
                "just to talk"
            ]
        },
        {
            id: "3",
            name: "Dr. Lopez",
            role: "Counselor",
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$454$2e$0_react$40$19$2e$2$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"],
            tags: [
                "appointment scheduling",
                "just to talk"
            ]
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full overflow-y-auto pr-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "font-heading text-2xl text-amber-900 underline mb-2",
                children: "My Support Circle"
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-body text-amber-900/70 mb-6",
                children: "The people I reach out to when things get rough."
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: contacts.map((contact)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSelectedContact(contact),
                                className: `w-full text-left p-4 border border-amber-200/50 rounded-lg hover:bg-amber-50 transition-colors ${selectedContact?.id === contact.id ? "bg-amber-50" : ""}`,
                                style: {
                                    boxShadow: "1px 1px 4px rgba(0,0,0,0.05)"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(contact.icon, {
                                            className: "w-6 h-6 text-amber-700/70 mt-0.5"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                            lineNumber: 59,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-heading text-lg text-amber-900",
                                                    children: [
                                                        contact.name,
                                                        " (",
                                                        contact.role,
                                                        ")"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                                    lineNumber: 61,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-body text-sm text-amber-900/60",
                                                    children: contact.tags.join(" · ")
                                                }, void 0, false, {
                                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                                    lineNumber: 64,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-body text-xs text-amber-900/40 mt-1",
                                                    children: "Tap to open details"
                                                }, void 0, false, {
                                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                                    lineNumber: 65,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                            lineNumber: 60,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                    lineNumber: 58,
                                    columnNumber: 15
                                }, this)
                            }, contact.id, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                lineNumber: 50,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: selectedContact ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "font-heading text-xl text-amber-900 mb-2",
                                    children: [
                                        selectedContact.name,
                                        " – ",
                                        selectedContact.role
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                    lineNumber: 76,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-body text-amber-900/70 mb-4",
                                    children: selectedContact.tags.join(" · ")
                                }, void 0, false, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                    lineNumber: 79,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-3 mb-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "flex-1 py-2 px-4 border border-amber-300 rounded font-body text-amber-900 hover:bg-amber-50 transition-colors",
                                            style: {
                                                boxShadow: "1px 1px 4px rgba(0,0,0,0.1)"
                                            },
                                            children: "Call"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                            lineNumber: 83,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "flex-1 py-2 px-4 border border-amber-300 rounded font-body text-amber-900 hover:bg-amber-50 transition-colors",
                                            style: {
                                                boxShadow: "1px 1px 4px rgba(0,0,0,0.1)"
                                            },
                                            children: "Text"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                            lineNumber: 89,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "flex-1 py-2 px-4 border border-amber-300 rounded font-body text-amber-900 hover:bg-amber-50 transition-colors",
                                            style: {
                                                boxShadow: "1px 1px 4px rgba(0,0,0,0.1)"
                                            },
                                            children: "Directions"
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                            lineNumber: 95,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                    lineNumber: 82,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-body text-sm text-amber-900/50 mb-6",
                                    children: "One tap to reach out."
                                }, void 0, false, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                    lineNumber: 103,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-heading text-lg text-amber-900 mb-2",
                                    children: "Things I want to talk about"
                                }, void 0, false, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                    lineNumber: 106,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-body text-amber-900/70 italic",
                                            children: "Ask about step work."
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                            lineNumber: 108,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-body text-amber-900/70 italic",
                                            children: "Share how this week went."
                                        }, void 0, false, {
                                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                            lineNumber: 109,
                                            columnNumber: 17
                                        }, this),
                                        [
                                            ...Array(3)
                                        ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-6 border-b border-amber-200/50"
                                            }, i, false, {
                                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                                lineNumber: 111,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                    lineNumber: 107,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                            lineNumber: 75,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-center h-full",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-body text-amber-900/50 italic text-center",
                                children: "Tap a contact to see details"
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                                lineNumber: 117,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                            lineNumber: 116,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-body text-sm text-amber-900/50 text-right mt-6 italic",
                children: "You don't have to do this alone."
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_s(SupportPage, "/xmK38wx+Rtjo8kuvkedxNQZN+w=");
_c = SupportPage;
var _c;
__turbopack_context__.k.register(_c, "SupportPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/placeholder-page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PlaceholderPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function PlaceholderPage({ title, description }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-full flex flex-col items-center justify-center text-center px-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "font-heading text-3xl text-amber-900/80 mb-4",
                children: title
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/placeholder-page.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-body text-lg text-amber-900/60 max-w-md",
                children: description
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/placeholder-page.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8 w-24 h-1 bg-amber-200 rounded-full"
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/placeholder-page.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/placeholder-page.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_c = PlaceholderPage;
var _c;
__turbopack_context__.k.register(_c, "PlaceholderPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NotebookShell
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$tab$2d$navigation$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/tab-navigation.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$bookmark$2d$ribbon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/bookmark-ribbon.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$sticky$2d$note$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/sticky-note.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$today$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/today-page.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$resources$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/resources-page.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$support$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/support-page.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$placeholder$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/pages/placeholder-page.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
const tabs = [
    {
        id: "today",
        label: "Today",
        color: "bg-sky-200"
    },
    {
        id: "resources",
        label: "Resources",
        color: "bg-orange-200"
    },
    {
        id: "support",
        label: "Support",
        color: "bg-green-200"
    },
    {
        id: "growth",
        label: "Growth",
        color: "bg-yellow-200"
    },
    {
        id: "work",
        label: "Work",
        color: "bg-purple-200"
    },
    {
        id: "more",
        label: "More",
        color: "bg-pink-200"
    }
];
function NotebookShell({ onClose, nickname }) {
    _s();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("today");
    const [showSettings, setShowSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [direction, setDirection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const handleTabChange = (tabId)=>{
        const currentIndex = tabs.findIndex((t)=>t.id === activeTab);
        const newIndex = tabs.findIndex((t)=>t.id === tabId);
        setDirection(newIndex > currentIndex ? 1 : -1);
        setActiveTab(tabId);
    };
    const renderPage = ()=>{
        switch(activeTab){
            case "today":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$today$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    nickname: nickname
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 42,
                    columnNumber: 16
                }, this);
            case "resources":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$resources$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 44,
                    columnNumber: 16
                }, this);
            case "support":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$support$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 46,
                    columnNumber: 16
                }, this);
            case "growth":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$placeholder$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    title: "Growth",
                    description: "Step work, reflections, and personal development tools coming soon."
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 49,
                    columnNumber: 11
                }, this);
            case "work":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$placeholder$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    title: "Work",
                    description: "Employment resources, resume tools, and job search features coming soon."
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 56,
                    columnNumber: 11
                }, this);
            case "more":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$placeholder$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    title: "More",
                    description: "Additional features and settings coming soon."
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 62,
                    columnNumber: 16
                }, this);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$pages$2f$today$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    nickname: nickname
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 64,
                    columnNumber: 16
                }, this);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        className: "relative",
        initial: {
            opacity: 0,
            scale: 0.95
        },
        animate: {
            opacity: 1,
            scale: 1
        },
        transition: {
            duration: 0.5,
            ease: [
                0.4,
                0,
                0.2,
                1
            ]
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute -bottom-6 left-1/2 -translate-x-1/2 w-[95%] h-10 bg-black/40 blur-2xl rounded-full"
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                lineNumber: 76,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative w-[360px] h-[520px] md:w-[800px] md:h-[560px] rounded-lg overflow-visible",
                style: {
                    boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 12px 24px -8px rgba(0, 0, 0, 0.3)
          `
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute left-0 top-0 bottom-0 w-4 md:w-10 z-20 rounded-l-lg",
                        style: {
                            background: `
              linear-gradient(90deg, rgba(60, 100, 115, 1) 0%, rgba(70, 115, 130, 1) 50%, rgba(50, 85, 100, 1) 100%)
            `,
                            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3)"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 opacity-20",
                            style: {
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`
                            }
                        }, void 0, false, {
                            fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute left-4 md:left-10 right-0 top-0 bottom-0 rounded-r-lg overflow-hidden",
                        style: {
                            background: `linear-gradient(135deg, #f5f0e6 0%, #ebe5d9 50%, #e5dfd3 100%)`
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 opacity-40",
                                style: {
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' opacity='0.4'/%3E%3C/svg%3E")`
                                }
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 pointer-events-none",
                                children: [
                                    ...Array(25)
                                ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute left-0 right-0 h-px bg-sky-200/30",
                                        style: {
                                            top: `${(i + 1) * 22}px`
                                        }
                                    }, i, false, {
                                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                        lineNumber: 125,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                lineNumber: 123,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute left-12 top-0 bottom-0 w-px bg-red-300/40"
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                lineNumber: 134,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                mode: "wait",
                                initial: false,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    className: "absolute inset-0 p-6 pl-16 pr-12",
                                    initial: {
                                        rotateY: direction > 0 ? 90 : -90,
                                        opacity: 0,
                                        originX: direction > 0 ? 0 : 1
                                    },
                                    animate: {
                                        rotateY: 0,
                                        opacity: 1
                                    },
                                    exit: {
                                        rotateY: direction > 0 ? -90 : 90,
                                        opacity: 0,
                                        originX: direction > 0 ? 0 : 1
                                    },
                                    transition: {
                                        duration: 0.5,
                                        ease: [
                                            0.4,
                                            0,
                                            0.2,
                                            1
                                        ]
                                    },
                                    style: {
                                        transformStyle: "preserve-3d"
                                    },
                                    children: renderPage()
                                }, activeTab, false, {
                                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                    lineNumber: 138,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                lineNumber: 137,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$tab$2d$navigation$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        tabs: tabs,
                        activeTab: activeTab,
                        onTabChange: handleTabChange
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                        lineNumber: 167,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$bookmark$2d$ribbon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        onClick: ()=>setShowSettings(true)
                    }, void 0, false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                        lineNumber: 170,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: showSettings && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$sticky$2d$note$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    title: "My Notebook",
                    onClose: ()=>setShowSettings(false),
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-body text-amber-900/70 underline",
                                children: "Nickname & privacy"
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                lineNumber: 178,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-body text-amber-900/70 underline",
                                children: "Home screen & favorites"
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                lineNumber: 179,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-body text-amber-900/70 underline",
                                children: "Language & text size"
                            }, void 0, false, {
                                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                                lineNumber: 180,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                        lineNumber: 177,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                    lineNumber: 176,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
                lineNumber: 174,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx",
        lineNumber: 69,
        columnNumber: 5
    }, this);
}
_s(NotebookShell, "Xg4M9HH1eqMRre1aqsBn/6lbjUk=");
_c = NotebookShell;
var _c;
__turbopack_context__.k.register(_c, "NotebookShell");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/components/desktop/lamp-glow.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LampGlow
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function LampGlow() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute pointer-events-none",
                style: {
                    top: "-10%",
                    left: "-10%",
                    width: "60%",
                    height: "60%",
                    background: "radial-gradient(ellipse at center, rgba(255,235,180,0.25) 0%, rgba(255,220,150,0.1) 40%, transparent 70%)",
                    zIndex: 1
                }
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/desktop/lamp-glow.tsx",
                lineNumber: 7,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 pointer-events-none",
                style: {
                    background: "linear-gradient(135deg, rgba(255,240,200,0.08) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                    zIndex: 1
                }
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/components/desktop/lamp-glow.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_c = LampGlow;
var _c;
__turbopack_context__.k.register(_c, "LampGlow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Workspace/dev-projects/sonash-v0/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/next@16.0.7_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$book$2d$cover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/book-cover.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$notebook$2d$shell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/notebook/notebook-shell.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$desktop$2f$lamp$2d$glow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/components/desktop/lamp-glow.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Workspace/dev-projects/sonash-v0/node_modules/.pnpm/framer-motion@12.23.25_@emo_858c02179ba0d1fa2a2162846fa9009e/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function Home() {
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const nickname = "Alex";
    const cleanDays = 37;
    const handleOpenBook = ()=>{
        if (!isOpen) {
            setIsOpen(true);
        }
    };
    const handleCloseBook = ()=>{
        setIsOpen(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "fixed inset-0 overflow-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-cover bg-center bg-no-repeat",
                style: {
                    backgroundImage: `url('/images/wood-table.jpg')`
                }
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 pointer-events-none",
                style: {
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)"
                }
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$desktop$2f$lamp$2d$glow$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 min-h-full w-full flex items-center justify-center py-12 pr-12 md:pr-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$12$2e$23$2e$25_$40$emo_858c02179ba0d1fa2a2162846fa9009e$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                    mode: "wait",
                    children: !isOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$book$2d$cover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        nickname: nickname,
                        cleanDays: cleanDays,
                        onOpen: handleOpenBook
                    }, "cover", false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
                        lineNumber: 49,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Workspace$2f$dev$2d$projects$2f$sonash$2d$v0$2f$components$2f$notebook$2f$notebook$2d$shell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        onClose: handleCloseBook,
                        nickname: nickname
                    }, "shell", false, {
                        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
                        lineNumber: 51,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
                    lineNumber: 47,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Workspace/dev-projects/sonash-v0/app/page.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(Home, "+sus0Lb0ewKHdwiUhiTAJFoFyQ0=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Workspace_dev-projects_sonash-v0_03174446._.js.map