// // // // import React, { useState, useRef, useCallback, useEffect } from "react";
// // // // import { useLocation, useNavigate } from "react-router-dom";
// // // // import {
// // // //   Download, ArrowLeft, Plus, Trash2, Move, Type,
// // // //   Sun, Contrast, Droplets, Wind, Image as ImageIcon,
// // // //   Bold, Italic, AlignLeft, AlignCenter, AlignRight,
// // // //   RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp,
// // // //   Layers, Palette, Sliders, Check, X, Copy,
// // // // } from "lucide-react";
// // // // import {
// // // //   PosterData, TextLayer, LogoLayer, ImageAdjustments,
// // // //   PostEditorState, DEFAULT_POST_EDITOR, TextAlign,
// // // // } from "../types";

// // // // // ─── Polices disponibles ──────────────────────────────────────────────────────

// // // // const FONTS = [
// // // //   "Arial", "Georgia", "Impact", "Helvetica",
// // // //   "Times New Roman", "Verdana", "Trebuchet MS",
// // // //   "Courier New", "Palatino", "Tahoma",
// // // // ];

// // // // function generateId() { return Math.random().toString(36).substr(2, 9); }

// // // // // ─── Hook canvas export ───────────────────────────────────────────────────────

// // // // function usePosterExport() {
// // // //   const exportPoster = useCallback(async (
// // // //     imageUrl: string,
// // // //     textLayers: TextLayer[],
// // // //     logoLayer: LogoLayer | null,
// // // //     adjustments: ImageAdjustments,
// // // //     width: number,
// // // //     height: number
// // // //   ): Promise<string> => {
// // // //     const canvas = document.createElement("canvas");
// // // //     canvas.width = width;
// // // //     canvas.height = height;
// // // //     const ctx = canvas.getContext("2d")!;

// // // //     // Charger image de fond
// // // //     await new Promise<void>((resolve, reject) => {
// // // //       const img = new Image();
// // // //       img.crossOrigin = "anonymous";
// // // //       img.onload = () => {
// // // //         ctx.filter = [
// // // //           `brightness(${1 + adjustments.brightness / 100})`,
// // // //           `contrast(${1 + adjustments.contrast / 100})`,
// // // //           `saturate(${1 + adjustments.saturation / 100})`,
// // // //           adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
// // // //         ].filter(Boolean).join(" ");

// // // //         // object-cover : l'image remplit tout le canvas sans espaces, recadrage centré
// // // //         const imgAspect = img.naturalWidth / img.naturalHeight;
// // // //         const canvasAspect = width / height;
// // // //         let sx: number, sy: number, sw: number, sh: number;
// // // //         if (imgAspect > canvasAspect) {
// // // //           // Image plus large que le canvas : crop horizontal centré
// // // //           sh = img.naturalHeight;
// // // //           sw = img.naturalHeight * canvasAspect;
// // // //           sx = (img.naturalWidth - sw) / 2;
// // // //           sy = 0;
// // // //         } else {
// // // //           // Image plus haute que le canvas : crop vertical centré
// // // //           sw = img.naturalWidth;
// // // //           sh = img.naturalWidth / canvasAspect;
// // // //           sx = 0;
// // // //           sy = (img.naturalHeight - sh) / 2;
// // // //         }
// // // //         ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
// // // //         ctx.filter = "none";
// // // //         resolve();
// // // //       };
// // // //       img.onerror = reject;
// // // //       img.src = imageUrl;
// // // //     });

// // // //     // Dessiner logo
// // // //     if (logoLayer) {
// // // //       await new Promise<void>((resolve) => {
// // // //         const img = new Image();
// // // //         img.crossOrigin = "anonymous";
// // // //         img.onload = () => {
// // // //           const logoW = (logoLayer.width / 100) * width;
// // // //           const logoH = (logoW / img.naturalWidth) * img.naturalHeight;
// // // //           ctx.globalAlpha = logoLayer.opacity;
// // // //           ctx.drawImage(img, (logoLayer.x / 100) * width, (logoLayer.y / 100) * height, logoW, logoH);
// // // //           ctx.globalAlpha = 1;
// // // //           resolve();
// // // //         };
// // // //         img.onerror = () => resolve();
// // // //         img.src = logoLayer.src;
// // // //       });
// // // //     }

// // // //     // Dessiner textes
// // // //     for (const layer of textLayers) {
// // // //       if (!layer.content) continue;
// // // //       ctx.save();
// // // //       const x = (layer.x / 100) * width;
// // // //       const y = (layer.y / 100) * height;
// // // //       ctx.translate(x, y);
// // // //       ctx.rotate((layer.rotation * Math.PI) / 180);
// // // //       ctx.globalAlpha = layer.opacity;

// // // //       const fontStr = `${layer.italic ? "italic " : ""}${layer.bold ? "bold " : ""}${layer.fontSize}px "${layer.fontFamily}"`;
// // // //       ctx.font = fontStr;
// // // //       ctx.textAlign = layer.align as CanvasTextAlign;
// // // //       ctx.textBaseline = "middle";

// // // //       // Background du texte
// // // //       if (layer.backgroundColor) {
// // // //         const metrics = ctx.measureText(layer.content);
// // // //         const pad = layer.backgroundPadding ?? 8;
// // // //         const bw = metrics.width + pad * 2;
// // // //         const bh = layer.fontSize + pad * 2;
// // // //         const bx = layer.align === "center" ? -bw / 2 : layer.align === "right" ? -bw : 0;
// // // //         ctx.fillStyle = layer.backgroundColor;
// // // //         const r = layer.backgroundRadius ?? 6;
// // // //         ctx.beginPath();
// // // //         ctx.roundRect(bx - pad, -bh / 2, bw, bh, r);
// // // //         ctx.fill();
// // // //       }

// // // //       // Ombre portée légère
// // // //       ctx.shadowColor = "rgba(0,0,0,0.5)";
// // // //       ctx.shadowBlur = 4;
// // // //       ctx.shadowOffsetX = 1;
// // // //       ctx.shadowOffsetY = 1;
// // // //       ctx.fillStyle = layer.color;
// // // //       ctx.fillText(layer.content, 0, 0);
// // // //       ctx.restore();
// // // //     }

// // // //     return canvas.toDataURL("image/png");
// // // //   }, []);

// // // //   return { exportPoster };
// // // // }

// // // // // ─── FIX 2 : Placement intelligent des éléments selon le format ──────────────

// // // // /**
// // // //  * Calcule les positions et tailles optimales des couches texte
// // // //  * selon le format de l'affiche (portrait, paysage, carré).
// // // //  * Zones : slogan=haut-centre, prix=haut-droite, promo=milieu, cta=bas-centre
// // // //  */
// // // // function getSmartLayout(format: string): {
// // // //   slogan:  { x: number; y: number; fontSize: number };
// // // //   price:   { x: number; y: number; fontSize: number };
// // // //   promo:   { x: number; y: number; fontSize: number };
// // // //   cta:     { x: number; y: number; fontSize: number };
// // // // } {
// // // //   // Portrait 9:16 (stories, téléphone)
// // // //   if (format === "9:16") {
// // // //     return {
// // // //       slogan: { x: 50, y: 12,  fontSize: 36 },
// // // //       price:  { x: 82, y: 82,  fontSize: 32 },
// // // //       promo:  { x: 50, y: 35,  fontSize: 26 },
// // // //       cta:    { x: 50, y: 91,  fontSize: 20 },
// // // //     };
// // // //   }
// // // //   // Paysage 16:9 (bannière, desktop)
// // // //   if (format === "16:9") {
// // // //     return {
// // // //       slogan: { x: 50, y: 14,  fontSize: 34 },
// // // //       price:  { x: 88, y: 75,  fontSize: 30 },
// // // //       promo:  { x: 30, y: 55,  fontSize: 24 },
// // // //       cta:    { x: 50, y: 88,  fontSize: 19 },
// // // //     };
// // // //   }
// // // //   // Portrait doux 3:4
// // // //   if (format === "3:4") {
// // // //     return {
// // // //       slogan: { x: 50, y: 13,  fontSize: 38 },
// // // //       price:  { x: 82, y: 80,  fontSize: 34 },
// // // //       promo:  { x: 50, y: 38,  fontSize: 27 },
// // // //       cta:    { x: 50, y: 90,  fontSize: 21 },
// // // //     };
// // // //   }
// // // //   // Paysage doux 4:3
// // // //   if (format === "4:3") {
// // // //     return {
// // // //       slogan: { x: 50, y: 13,  fontSize: 36 },
// // // //       price:  { x: 85, y: 78,  fontSize: 32 },
// // // //       promo:  { x: 35, y: 52,  fontSize: 25 },
// // // //       cta:    { x: 50, y: 89,  fontSize: 20 },
// // // //     };
// // // //   }
// // // //   // Carré 1:1 (par défaut)
// // // //   return {
// // // //     slogan: { x: 50, y: 13,  fontSize: 40 },
// // // //     price:  { x: 83, y: 80,  fontSize: 34 },
// // // //     promo:  { x: 50, y: 38,  fontSize: 28 },
// // // //     cta:    { x: 50, y: 90,  fontSize: 22 },
// // // //   };
// // // // }

// // // // // ─── TextLayerCard ────────────────────────────────────────────────────────────

// // // // const TextLayerCard: React.FC<{
// // // //   layer: TextLayer;
// // // //   selected: boolean;
// // // //   onSelect: () => void;
// // // //   onChange: (l: TextLayer) => void;
// // // //   onDelete: () => void;
// // // // }> = ({ layer, selected, onSelect, onChange, onDelete }) => {
// // // //   const [expanded, setExpanded] = useState(selected);
// // // //   useEffect(() => { if (selected) setExpanded(true); }, [selected]);

// // // //   const set = (updates: Partial<TextLayer>) => onChange({ ...layer, ...updates });

// // // //   const typeLabel: Record<TextLayer["type"], string> = {
// // // //     slogan: "Slogan", price: "Prix", promo: "Promo", cta: "CTA", custom: "Texte libre",
// // // //   };
// // // //   const typeColor: Record<TextLayer["type"], string> = {
// // // //     slogan: "bg-violet-100 text-violet-700",
// // // //     price:  "bg-emerald-100 text-emerald-700",
// // // //     promo:  "bg-orange-100 text-orange-700",
// // // //     cta:    "bg-blue-100 text-blue-700",
// // // //     custom: "bg-slate-100 text-slate-700",
// // // //   };

// // // //   return (
// // // //     <div
// // // //       className={`rounded-2xl border transition-all ${selected ? "border-blue-400 shadow-md shadow-blue-100" : "border-slate-200"}`}
// // // //       onClick={onSelect}
// // // //     >
// // // //       {/* Header */}
// // // //       <div className="flex items-center gap-2 p-3">
// // // //         <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeColor[layer.type]}`}>
// // // //           {typeLabel[layer.type]}
// // // //         </span>
// // // //         <span className="flex-1 text-xs font-medium text-slate-700 truncate">
// // // //           {layer.content || <span className="text-slate-400 italic">Vide</span>}
// // // //         </span>
// // // //         <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} className="text-slate-400 hover:text-slate-600">
// // // //           {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
// // // //         </button>
// // // //         <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600">
// // // //           <Trash2 className="w-3.5 h-3.5" />
// // // //         </button>
// // // //       </div>

// // // //       {/* Corps éditable */}
// // // //       {expanded && (
// // // //         <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3" onClick={e => e.stopPropagation()}>
// // // //           {/* Contenu */}
// // // //           <input
// // // //             className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
// // // //             placeholder="Contenu du texte..."
// // // //             value={layer.content}
// // // //             onChange={e => set({ content: e.target.value })}
// // // //           />

// // // //           {/* Police & taille */}
// // // //           <div className="grid grid-cols-2 gap-2">
// // // //             <div>
// // // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Police</p>
// // // //               <select className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none"
// // // //                 value={layer.fontFamily} onChange={e => set({ fontFamily: e.target.value })}>
// // // //                 {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div>
// // // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille</p>
// // // //               <div className="flex items-center gap-1">
// // // //                 <input type="number" min={10} max={200}
// // // //                   className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none"
// // // //                   value={layer.fontSize} onChange={e => set({ fontSize: Number(e.target.value) })} />
// // // //                 <span className="text-[10px] text-slate-400">px</span>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* Couleur & style */}
// // // //           <div className="flex items-center gap-3">
// // // //             <div className="flex items-center gap-1.5">
// // // //               <input type="color" value={layer.color} onChange={e => set({ color: e.target.value })}
// // // //                 className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
// // // //               <span className="text-[10px] text-slate-500 font-mono">{layer.color}</span>
// // // //             </div>
// // // //             <div className="flex gap-1 ml-auto">
// // // //               <button onClick={() => set({ bold: !layer.bold })}
// // // //                 className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${layer.bold ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// // // //                 <Bold className="w-3 h-3" />
// // // //               </button>
// // // //               <button onClick={() => set({ italic: !layer.italic })}
// // // //                 className={`w-7 h-7 rounded-lg text-xs italic flex items-center justify-center transition-all ${layer.italic ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// // // //                 <Italic className="w-3 h-3" />
// // // //               </button>
// // // //               {(["left", "center", "right"] as TextAlign[]).map(a => (
// // // //                 <button key={a} onClick={() => set({ align: a })}
// // // //                   className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${layer.align === a ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// // // //                   {a === "left" ? <AlignLeft className="w-3 h-3" /> : a === "center" ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
// // // //                 </button>
// // // //               ))}
// // // //             </div>
// // // //           </div>

// // // //           {/* Position */}
// // // //           <div className="grid grid-cols-2 gap-2">
// // // //             <div>
// // // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position X (%)</p>
// // // //               <input type="range" min={0} max={100} value={layer.x} onChange={e => set({ x: Number(e.target.value) })}
// // // //                 className="w-full accent-blue-500" />
// // // //               <span className="text-[10px] text-slate-500 font-mono">{layer.x}%</span>
// // // //             </div>
// // // //             <div>
// // // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position Y (%)</p>
// // // //               <input type="range" min={0} max={100} value={layer.y} onChange={e => set({ y: Number(e.target.value) })}
// // // //                 className="w-full accent-blue-500" />
// // // //               <span className="text-[10px] text-slate-500 font-mono">{layer.y}%</span>
// // // //             </div>
// // // //           </div>

// // // //           {/* Rotation & Opacité */}
// // // //           <div className="grid grid-cols-2 gap-2">
// // // //             <div>
// // // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rotation</p>
// // // //               <div className="flex items-center gap-1">
// // // //                 <input type="range" min={-180} max={180} value={layer.rotation} onChange={e => set({ rotation: Number(e.target.value) })}
// // // //                   className="flex-1 accent-blue-500" />
// // // //                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{layer.rotation}°</span>
// // // //               </div>
// // // //             </div>
// // // //             <div>
// // // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
// // // //               <div className="flex items-center gap-1">
// // // //                 <input type="range" min={0} max={1} step={0.05} value={layer.opacity} onChange={e => set({ opacity: Number(e.target.value) })}
// // // //                   className="flex-1 accent-blue-500" />
// // // //                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* Fond du texte */}
// // // //           <div>
// // // //             <div className="flex items-center justify-between mb-1.5">
// // // //               <p className="text-[9px] font-black text-slate-400 uppercase">Fond du texte</p>
// // // //               <button
// // // //                 onClick={() => set({ backgroundColor: layer.backgroundColor ? undefined : "rgba(0,0,0,0.5)" })}
// // // //                 className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${layer.backgroundColor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
// // // //                 {layer.backgroundColor ? "Activé" : "Désactivé"}
// // // //               </button>
// // // //             </div>
// // // //             {layer.backgroundColor && (
// // // //               <div className="flex items-center gap-2">
// // // //                 <input type="color" value={layer.backgroundColor.startsWith("rgba") ? "#000000" : layer.backgroundColor}
// // // //                   onChange={e => set({ backgroundColor: e.target.value + "99" })}
// // // //                   className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
// // // //                 <input type="range" min={0} max={20} value={layer.backgroundPadding ?? 8}
// // // //                   onChange={e => set({ backgroundPadding: Number(e.target.value) })}
// // // //                   className="flex-1 accent-blue-500" />
// // // //                 <span className="text-[10px] text-slate-400">padding</span>
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // };

// // // // // ─── Page Résultats + Éditeur ─────────────────────────────────────────────────

// // // // const ResultsPage: React.FC = () => {
// // // //   const location = useLocation();
// // // //   const navigate = useNavigate();
// // // //   const { exportPoster } = usePosterExport();

// // // //   const poster: PosterData | undefined = location.state?.poster;
// // // //   const analysis = location.state?.analysis;

// // // //   const [editorState, setEditorState] = useState<PostEditorState>(DEFAULT_POST_EDITOR);
// // // //   const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
// // // //   const [activePanel, setActivePanel] = useState<"layers" | "adjust" | "logo">("layers");
// // // //   const [exporting, setExporting] = useState(false);
// // // //   const [exported, setExported] = useState(false);

// // // //   const logoInputRef = useRef<HTMLInputElement>(null);
// // // //   const previewRef = useRef<HTMLDivElement>(null);

// // // //   // ── FIX 2 : Initialiser les couches texte avec placement intelligent ────────
// // // //   useEffect(() => {
// // // //     if (!poster || !analysis) return;

// // // //     // Récupérer le layout intelligent selon le format
// // // //     const layout = getSmartLayout(poster.format);

// // // //     const layers: TextLayer[] = [];

// // // //     // Slogan — zone haute, centré, très visible
// // // //     if (analysis.slogan) {
// // // //       layers.push({
// // // //         id: generateId(),
// // // //         type: "slogan",
// // // //         content: analysis.slogan,
// // // //         x: layout.slogan.x,
// // // //         y: layout.slogan.y,
// // // //         fontSize: layout.slogan.fontSize,
// // // //         fontFamily: "Impact",
// // // //         color: "#FFFFFF",
// // // //         bold: true,
// // // //         italic: false,
// // // //         align: "center",
// // // //         rotation: 0,
// // // //         opacity: 1,
// // // //         backgroundColor: "rgba(0,0,0,0.45)",
// // // //         backgroundPadding: 14,
// // // //         backgroundRadius: 10,
// // // //       });
// // // //     }

// // // //     // Prix — zone basse-droite, badge doré bien visible
// // // //     if (analysis.generatedPrice) {
// // // //       layers.push({
// // // //         id: generateId(),
// // // //         type: "price",
// // // //         content: analysis.generatedPrice,
// // // //         x: layout.price.x,
// // // //         y: layout.price.y,
// // // //         fontSize: layout.price.fontSize,
// // // //         fontFamily: "Arial",
// // // //         color: "#FFD700",
// // // //         bold: true,
// // // //         italic: false,
// // // //         align: "center",
// // // //         rotation: 0,
// // // //         opacity: 1,
// // // //         backgroundColor: "rgba(0,0,0,0.65)",
// // // //         backgroundPadding: 12,
// // // //         backgroundRadius: 50,
// // // //       });
// // // //     }

// // // //     // Promo — zone milieu, légèrement incliné pour dynamisme
// // // //     if (analysis.generatedPromo) {
// // // //       layers.push({
// // // //         id: generateId(),
// // // //         type: "promo",
// // // //         content: analysis.generatedPromo,
// // // //         x: layout.promo.x,
// // // //         y: layout.promo.y,
// // // //         fontSize: layout.promo.fontSize,
// // // //         fontFamily: "Arial",
// // // //         color: "#FF4444",
// // // //         bold: true,
// // // //         italic: false,
// // // //         align: "center",
// // // //         rotation: -4,
// // // //         opacity: 1,
// // // //         backgroundColor: "#FFFFFF",
// // // //         backgroundPadding: 11,
// // // //         backgroundRadius: 6,
// // // //       });
// // // //     }

// // // //     // CTA — zone basse, centré, bouton arrondi bleu
// // // //     if (analysis.generatedCta) {
// // // //       layers.push({
// // // //         id: generateId(),
// // // //         type: "cta",
// // // //         content: analysis.generatedCta,
// // // //         x: layout.cta.x,
// // // //         y: layout.cta.y,
// // // //         fontSize: layout.cta.fontSize,
// // // //         fontFamily: "Arial",
// // // //         color: "#FFFFFF",
// // // //         bold: true,
// // // //         italic: false,
// // // //         align: "center",
// // // //         rotation: 0,
// // // //         opacity: 1,
// // // //         backgroundColor: "#2563EB",
// // // //         backgroundPadding: 15,
// // // //         backgroundRadius: 50,
// // // //       });
// // // //     }

// // // //     setEditorState(prev => ({ ...prev, textLayers: layers }));
// // // //   }, [poster, analysis]);

// // // //   if (!poster) {
// // // //     return (
// // // //       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
// // // //         <p className="text-slate-500">Aucun poster à afficher.</p>
// // // //         <button onClick={() => navigate("/")} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">
// // // //           Retour au générateur
// // // //         </button>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   // Dimensions affiche selon format
// // // //   const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
// // // //     "1:1":  { w: 512, h: 512 },
// // // //     "9:16": { w: 360, h: 640 },
// // // //     "16:9": { w: 640, h: 360 },
// // // //     "4:3":  { w: 512, h: 384 },
// // // //     "3:4":  { w: 384, h: 512 },
// // // //   };
// // // //   const dims = FORMAT_DIMS[poster.format] ?? { w: 512, h: 512 };

// // // //   const { textLayers, logoLayer, adjustments } = editorState;

// // // //   const setAdj = (key: keyof ImageAdjustments, value: number) =>
// // // //     setEditorState(prev => ({ ...prev, adjustments: { ...prev.adjustments, [key]: value } }));

// // // //   const addTextLayer = () => {
// // // //     const layer: TextLayer = {
// // // //       id: generateId(),
// // // //       type: "custom",
// // // //       content: "Nouveau texte",
// // // //       x: 50, y: 50,
// // // //       fontSize: 32,
// // // //       fontFamily: "Arial",
// // // //       color: "#FFFFFF",
// // // //       bold: false,
// // // //       italic: false,
// // // //       align: "center",
// // // //       rotation: 0,
// // // //       opacity: 1,
// // // //     };
// // // //     setEditorState(prev => ({ ...prev, textLayers: [...prev.textLayers, layer] }));
// // // //     setSelectedLayerId(layer.id);
// // // //   };

// // // //   const updateLayer = (id: string, updated: TextLayer) =>
// // // //     setEditorState(prev => ({
// // // //       ...prev,
// // // //       textLayers: prev.textLayers.map(l => l.id === id ? updated : l),
// // // //     }));

// // // //   const deleteLayer = (id: string) =>
// // // //     setEditorState(prev => ({
// // // //       ...prev,
// // // //       textLayers: prev.textLayers.filter(l => l.id !== id),
// // // //     }));

// // // //   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// // // //     const file = e.target.files?.[0];
// // // //     if (!file) return;
// // // //     const reader = new FileReader();
// // // //     reader.onloadend = () => {
// // // //       const logo: LogoLayer = {
// // // //         id: generateId(),
// // // //         src: reader.result as string,
// // // //         x: 5, y: 5,
// // // //         width: 20,
// // // //         opacity: 1,
// // // //       };
// // // //       setEditorState(prev => ({ ...prev, logoLayer: logo }));
// // // //     };
// // // //     reader.readAsDataURL(file);
// // // //     if (logoInputRef.current) logoInputRef.current.value = "";
// // // //   };

// // // //   const handleExport = async () => {
// // // //     setExporting(true);
// // // //     try {
// // // //       const exportW = 1024;
// // // //       const exportH = Math.round(exportW * (dims.h / dims.w));
// // // //       const dataUrl = await exportPoster(
// // // //         poster.imageUrl, textLayers, logoLayer, adjustments, exportW, exportH
// // // //       );
// // // //       const a = document.createElement("a");
// // // //       a.href = dataUrl;
// // // //       a.download = `affiche-${poster.id}.png`;
// // // //       a.click();
// // // //       setExported(true);
// // // //       setTimeout(() => setExported(false), 3000);
// // // //     } catch (err) {
// // // //       console.error("Export:", err);
// // // //       alert("Erreur lors de l'export.");
// // // //     } finally {
// // // //       setExporting(false);
// // // //     }
// // // //   };

// // // //   // Filtre CSS pour la prévisualisation
// // // //   const previewFilter = [
// // // //     adjustments.brightness !== 0 ? `brightness(${1 + adjustments.brightness / 100})` : "",
// // // //     adjustments.contrast !== 0 ? `contrast(${1 + adjustments.contrast / 100})` : "",
// // // //     adjustments.saturation !== 0 ? `saturate(${1 + adjustments.saturation / 100})` : "",
// // // //     adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
// // // //   ].filter(Boolean).join(" ") || "none";

// // // //   const hasProductImage = poster.customization.userImages.some(i => i.role === "product");

// // // //   // ── FIX 2 : Échelle de police adaptée à la taille de prévisualisation ────────
// // // //   // Base de référence : 512px de largeur
// // // //   const fontScale = dims.w / 512;

// // // //   return (
// // // //     <div className="max-w-7xl mx-auto px-4 py-8">

// // // //       {/* Header */}
// // // //       <div className="flex items-center justify-between mb-6">
// // // //         <div className="flex items-center gap-3">
// // // //           <button onClick={() => navigate(-1)}
// // // //             className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
// // // //             <ArrowLeft className="w-4 h-4 text-slate-600" />
// // // //           </button>
// // // //           <div>
// // // //             <h1 className="text-2xl font-black text-slate-900">Éditeur Post-Génération</h1>
// // // //             <p className="text-xs text-slate-500 mt-0.5">
// // // //               {hasProductImage
// // // //                 ? "Mode 1 · Image fournie comme fond · Éditez les textes superposés"
// // // //                 : "Mode 2 · Image générée · Éditez les textes et ajustements"}
// // // //             </p>
// // // //           </div>
// // // //         </div>
// // // //         <button
// // // //           onClick={handleExport}
// // // //           disabled={exporting}
// // // //           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${
// // // //             exported
// // // //               ? "bg-emerald-500 text-white"
// // // //               : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
// // // //           }`}
// // // //         >
// // // //           {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
// // // //           {exporting ? "Export..." : exported ? "Téléchargé !" : "Exporter HD"}
// // // //         </button>
// // // //       </div>

// // // //       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

// // // //         {/* ════ PRÉVISUALISATION ════ */}
// // // //         <div className="lg:col-span-6 flex flex-col items-center">
// // // //           <div
// // // //             ref={previewRef}
// // // //             className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-200"
// // // //             style={{
// // // //               width: dims.w,
// // // //               height: dims.h,
// // // //               maxWidth: "100%",
// // // //             }}
// // // //           >
// // // //             {/* Image couvre tout le format sans espaces noirs */}
// // // //             <img
// // // //               src={poster.imageUrl}
// // // //               alt="Affiche"
// // // //               className="absolute inset-0 w-full h-full"
// // // //               style={{
// // // //                 objectFit: "cover",
// // // //                 objectPosition: "center center",
// // // //                 filter: previewFilter,
// // // //               }}
// // // //               draggable={false}
// // // //             />

// // // //             {/* Logo */}
// // // //             {logoLayer && (
// // // //               <div
// // // //                 className="absolute cursor-move select-none"
// // // //                 style={{
// // // //                   left: `${logoLayer.x}%`,
// // // //                   top: `${logoLayer.y}%`,
// // // //                   width: `${logoLayer.width}%`,
// // // //                   opacity: logoLayer.opacity,
// // // //                 }}
// // // //               >
// // // //                 <img src={logoLayer.src} alt="Logo" className="w-full" draggable={false} />
// // // //               </div>
// // // //             )}

// // // //             {/* ── FIX 2 : Couches texte avec fontSize scalée au format ── */}
// // // //             {textLayers.map(layer => (
// // // //               <div
// // // //                 key={layer.id}
// // // //                 onClick={() => setSelectedLayerId(layer.id)}
// // // //                 className={`absolute select-none transition-all ${selectedLayerId === layer.id ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
// // // //                 style={{
// // // //                   left: `${layer.x}%`,
// // // //                   top: `${layer.y}%`,
// // // //                   transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
// // // //                   opacity: layer.opacity,
// // // //                   cursor: "pointer",
// // // //                   fontFamily: layer.fontFamily,
// // // //                   // ── FIX 2 : fontSize scalée proportionnellement au format ──
// // // //                   fontSize: `${layer.fontSize * fontScale}px`,
// // // //                   color: layer.color,
// // // //                   fontWeight: layer.bold ? "bold" : "normal",
// // // //                   fontStyle: layer.italic ? "italic" : "normal",
// // // //                   textAlign: layer.align,
// // // //                   whiteSpace: "nowrap",
// // // //                   textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
// // // //                   backgroundColor: layer.backgroundColor,
// // // //                   padding: layer.backgroundColor
// // // //                     ? `${(layer.backgroundPadding ?? 8) * fontScale}px ${(layer.backgroundPadding ?? 8) * 1.5 * fontScale}px`
// // // //                     : undefined,
// // // //                   borderRadius: layer.backgroundColor ? `${layer.backgroundRadius ?? 6}px` : undefined,
// // // //                 }}
// // // //               >
// // // //                 {layer.content}
// // // //               </div>
// // // //             ))}
// // // //           </div>

// // // //           {/* Info mode */}
// // // //           <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
// // // //             hasProductImage
// // // //               ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
// // // //               : "bg-blue-50 text-blue-700 border border-blue-100"
// // // //           }`}>
// // // //             {hasProductImage ? <ImageIcon className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
// // // //             {hasProductImage
// // // //               ? "Image produit utilisée comme fond · Sans modification"
// // // //               : "Affiche générée par IA · Textes superposés"}
// // // //           </div>

// // // //           {/* Hashtags */}
// // // //           {analysis?.hashtags && analysis.hashtags.length > 0 && (
// // // //             <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
// // // //               {analysis.hashtags.map((tag: string) => (
// // // //                 <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium">
// // // //                   #{tag}
// // // //                 </span>
// // // //               ))}
// // // //             </div>
// // // //           )}
// // // //         </div>

// // // //         {/* ════ PANNEAU ÉDITION ════ */}
// // // //         <div className="lg:col-span-6 space-y-4">

// // // //           {/* Onglets panneau */}
// // // //           <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
// // // //             {([
// // // //               { id: "layers", label: "Textes", icon: <Type className="w-4 h-4" /> },
// // // //               { id: "adjust", label: "Réglages", icon: <Sliders className="w-4 h-4" /> },
// // // //               { id: "logo",   label: "Logo",    icon: <ImageIcon className="w-4 h-4" /> },
// // // //             ] as { id: typeof activePanel; label: string; icon: React.ReactNode }[]).map(tab => (
// // // //               <button
// // // //                 key={tab.id}
// // // //                 onClick={() => setActivePanel(tab.id)}
// // // //                 className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
// // // //                   activePanel === tab.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
// // // //                 }`}
// // // //               >
// // // //                 {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
// // // //               </button>
// // // //             ))}
// // // //           </div>

// // // //           {/* ── Panel: TEXTES ── */}
// // // //           {activePanel === "layers" && (
// // // //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-3">
// // // //               <div className="flex items-center justify-between">
// // // //                 <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// // // //                   <Type className="w-4 h-4" /> Couches de texte
// // // //                 </h3>
// // // //                 <button
// // // //                   onClick={addTextLayer}
// // // //                   className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
// // // //                 >
// // // //                   <Plus className="w-3.5 h-3.5" /> Ajouter
// // // //                 </button>
// // // //               </div>

// // // //               {textLayers.length === 0 ? (
// // // //                 <div className="py-8 text-center">
// // // //                   <Type className="w-8 h-8 text-slate-200 mx-auto mb-3" />
// // // //                   <p className="text-sm text-slate-400 font-medium">Aucune couche texte</p>
// // // //                   <p className="text-xs text-slate-300 mt-1">Cliquez "Ajouter" pour créer un texte</p>
// // // //                 </div>
// // // //               ) : (
// // // //                 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
// // // //                   {textLayers.map(layer => (
// // // //                     <TextLayerCard
// // // //                       key={layer.id}
// // // //                       layer={layer}
// // // //                       selected={selectedLayerId === layer.id}
// // // //                       onSelect={() => setSelectedLayerId(layer.id)}
// // // //                       onChange={updated => updateLayer(layer.id, updated)}
// // // //                       onDelete={() => {
// // // //                         deleteLayer(layer.id);
// // // //                         if (selectedLayerId === layer.id) setSelectedLayerId(null);
// // // //                       }}
// // // //                     />
// // // //                   ))}
// // // //                 </div>
// // // //               )}

// // // //               <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
// // // //                 Cliquez sur un texte dans la prévisualisation pour le sélectionner
// // // //               </p>
// // // //             </div>
// // // //           )}

// // // //           {/* ── Panel: RÉGLAGES IMAGE ── */}
// // // //           {activePanel === "adjust" && (
// // // //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-5">
// // // //               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// // // //                 <Sliders className="w-4 h-4" /> Réglages de l'image
// // // //               </h3>

// // // //               {[
// // // //                 { key: "brightness" as const, label: "Luminosité", icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
// // // //                 { key: "contrast"   as const, label: "Contraste",  icon: <Contrast className="w-4 h-4" />, min: -100, max: 100 },
// // // //                 { key: "saturation" as const, label: "Saturation", icon: <Droplets className="w-4 h-4" />, min: -100, max: 100 },
// // // //                 { key: "blur"       as const, label: "Flou",       icon: <Wind className="w-4 h-4" />, min: 0, max: 20 },
// // // //               ].map(({ key, label, icon, min, max }) => (
// // // //                 <div key={key}>
// // // //                   <div className="flex items-center justify-between mb-2">
// // // //                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
// // // //                       <span className="text-slate-400">{icon}</span>
// // // //                       {label}
// // // //                     </div>
// // // //                     <div className="flex items-center gap-2">
// // // //                       <span className="text-xs font-mono text-slate-500 w-10 text-right">{adjustments[key]}</span>
// // // //                       <button
// // // //                         onClick={() => setAdj(key, 0)}
// // // //                         className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
// // // //                       >
// // // //                         Reset
// // // //                       </button>
// // // //                     </div>
// // // //                   </div>
// // // //                   <input
// // // //                     type="range" min={min} max={max} value={adjustments[key]}
// // // //                     onChange={e => setAdj(key, Number(e.target.value))}
// // // //                     className="w-full accent-blue-500"
// // // //                   />
// // // //                   <div className="flex justify-between mt-0.5">
// // // //                     <span className="text-[9px] text-slate-300">{min}</span>
// // // //                     <span className="text-[9px] text-slate-300">{max}</span>
// // // //                   </div>
// // // //                 </div>
// // // //               ))}

// // // //               <button
// // // //                 onClick={() => setEditorState(prev => ({ ...prev, adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 } }))}
// // // //                 className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-2"
// // // //               >
// // // //                 <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser tous les réglages
// // // //               </button>
// // // //             </div>
// // // //           )}

// // // //           {/* ── Panel: LOGO ── */}
// // // //           {activePanel === "logo" && (
// // // //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-4">
// // // //               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// // // //                 <ImageIcon className="w-4 h-4" /> Logo de marque
// // // //               </h3>

// // // //               {!logoLayer ? (
// // // //                 <button
// // // //                   onClick={() => logoInputRef.current?.click()}
// // // //                   className="w-full py-10 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl transition-all flex flex-col items-center gap-3 group"
// // // //                 >
// // // //                   <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
// // // //                     <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
// // // //                   </div>
// // // //                   <div className="text-center">
// // // //                     <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Ajouter votre logo</p>
// // // //                     <p className="text-[10px] text-slate-400 mt-0.5">PNG avec transparence recommandé</p>
// // // //                   </div>
// // // //                 </button>
// // // //               ) : (
// // // //                 <div className="space-y-4">
// // // //                   {/* Aperçu */}
// // // //                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
// // // //                     <img src={logoLayer.src} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-100" />
// // // //                     <div className="flex-1">
// // // //                       <p className="text-xs font-black text-slate-700">Logo chargé</p>
// // // //                       <p className="text-[10px] text-slate-400">Ajustez la position et la taille ci-dessous</p>
// // // //                     </div>
// // // //                     <button onClick={() => setEditorState(prev => ({ ...prev, logoLayer: null }))}
// // // //                       className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center">
// // // //                       <X className="w-3.5 h-3.5" />
// // // //                     </button>
// // // //                   </div>

// // // //                   {/* Position X/Y */}
// // // //                   <div className="grid grid-cols-2 gap-3">
// // // //                     {([
// // // //                       { key: "x" as const, label: "Position X (%)" },
// // // //                       { key: "y" as const, label: "Position Y (%)" },
// // // //                     ]).map(({ key, label }) => (
// // // //                       <div key={key}>
// // // //                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
// // // //                         <input type="range" min={0} max={90} value={logoLayer[key]}
// // // //                           onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, [key]: Number(e.target.value) } : null }))}
// // // //                           className="w-full accent-blue-500" />
// // // //                         <span className="text-[10px] font-mono text-slate-500">{logoLayer[key]}%</span>
// // // //                       </div>
// // // //                     ))}
// // // //                   </div>

// // // //                   {/* Taille & Opacité */}
// // // //                   <div className="grid grid-cols-2 gap-3">
// // // //                     <div>
// // // //                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille (%)</p>
// // // //                       <input type="range" min={5} max={50} value={logoLayer.width}
// // // //                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, width: Number(e.target.value) } : null }))}
// // // //                         className="w-full accent-blue-500" />
// // // //                       <span className="text-[10px] font-mono text-slate-500">{logoLayer.width}%</span>
// // // //                     </div>
// // // //                     <div>
// // // //                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
// // // //                       <input type="range" min={0.1} max={1} step={0.05} value={logoLayer.opacity}
// // // //                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, opacity: Number(e.target.value) } : null }))}
// // // //                         className="w-full accent-blue-500" />
// // // //                       <span className="text-[10px] font-mono text-slate-500">{Math.round(logoLayer.opacity * 100)}%</span>
// // // //                     </div>
// // // //                   </div>

// // // //                   <button onClick={() => logoInputRef.current?.click()}
// // // //                     className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
// // // //                     Changer le logo
// // // //                   </button>
// // // //                 </div>
// // // //               )}
// // // //             </div>
// // // //           )}

// // // //           {/* Copier le texte marketing */}
// // // //           {analysis?.marketingCopy && (
// // // //             <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
// // // //               <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Texte marketing généré</p>
// // // //               <p className="text-sm text-slate-700 leading-relaxed">{analysis.marketingCopy}</p>
// // // //               <button
// // // //                 onClick={() => navigator.clipboard.writeText(analysis.marketingCopy)}
// // // //                 className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
// // // //               >
// // // //                 <Copy className="w-3 h-3" /> Copier
// // // //               </button>
// // // //             </div>
// // // //           )}
// // // //         </div>
// // // //       </div>

// // // //       <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
// // // //     </div>
// // // //   );
// // // // };

// // // // export default ResultsPage;


// // // import React, { useState, useRef, useCallback, useEffect } from "react";
// // // import { useLocation, useNavigate } from "react-router-dom";
// // // import {
// // //   Download, ArrowLeft, Plus, Trash2, Move, Type,
// // //   Sun, Contrast, Droplets, Wind, Image as ImageIcon,
// // //   Bold, Italic, AlignLeft, AlignCenter, AlignRight,
// // //   RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp,
// // //   Layers, Palette, Sliders, Check, X, Copy,
// // // } from "lucide-react";
// // // import {
// // //   PosterData, TextLayer, LogoLayer, ImageAdjustments,
// // //   PostEditorState, DEFAULT_POST_EDITOR, TextAlign,
// // // } from "../types";

// // // // ─── Polices disponibles ──────────────────────────────────────────────────────

// // // const FONTS = [
// // //   "Arial", "Georgia", "Impact", "Helvetica",
// // //   "Times New Roman", "Verdana", "Trebuchet MS",
// // //   "Courier New", "Palatino", "Tahoma",
// // // ];

// // // function generateId() { return Math.random().toString(36).substr(2, 9); }

// // // // ─── Hook canvas export ───────────────────────────────────────────────────────

// // // function usePosterExport() {
// // //   const exportPoster = useCallback(async (
// // //     imageUrl: string,
// // //     textLayers: TextLayer[],
// // //     logoLayer: LogoLayer | null,
// // //     adjustments: ImageAdjustments,
// // //     width: number,
// // //     height: number
// // //   ): Promise<string> => {
// // //     const canvas = document.createElement("canvas");
// // //     canvas.width = width;
// // //     canvas.height = height;
// // //     const ctx = canvas.getContext("2d")!;

// // //     // Charger image de fond
// // //     await new Promise<void>((resolve, reject) => {
// // //       const img = new Image();
// // //       img.crossOrigin = "anonymous";
// // //       img.onload = () => {
// // //         ctx.filter = [
// // //           `brightness(${1 + adjustments.brightness / 100})`,
// // //           `contrast(${1 + adjustments.contrast / 100})`,
// // //           `saturate(${1 + adjustments.saturation / 100})`,
// // //           adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
// // //         ].filter(Boolean).join(" ");

// // //         // object-cover : l'image remplit tout le canvas sans espaces, recadrage centré
// // //         const imgAspect = img.naturalWidth / img.naturalHeight;
// // //         const canvasAspect = width / height;
// // //         let sx: number, sy: number, sw: number, sh: number;
// // //         if (imgAspect > canvasAspect) {
// // //           // Image plus large que le canvas : crop horizontal centré
// // //           sh = img.naturalHeight;
// // //           sw = img.naturalHeight * canvasAspect;
// // //           sx = (img.naturalWidth - sw) / 2;
// // //           sy = 0;
// // //         } else {
// // //           // Image plus haute que le canvas : crop vertical centré
// // //           sw = img.naturalWidth;
// // //           sh = img.naturalWidth / canvasAspect;
// // //           sx = 0;
// // //           sy = (img.naturalHeight - sh) / 2;
// // //         }
// // //         ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
// // //         ctx.filter = "none";
// // //         resolve();
// // //       };
// // //       img.onerror = reject;
// // //       img.src = imageUrl;
// // //     });

// // //     // Dessiner logo
// // //     if (logoLayer) {
// // //       await new Promise<void>((resolve) => {
// // //         const img = new Image();
// // //         img.crossOrigin = "anonymous";
// // //         img.onload = () => {
// // //           const logoW = (logoLayer.width / 100) * width;
// // //           const logoH = (logoW / img.naturalWidth) * img.naturalHeight;
// // //           ctx.globalAlpha = logoLayer.opacity;
// // //           ctx.drawImage(img, (logoLayer.x / 100) * width, (logoLayer.y / 100) * height, logoW, logoH);
// // //           ctx.globalAlpha = 1;
// // //           resolve();
// // //         };
// // //         img.onerror = () => resolve();
// // //         img.src = logoLayer.src;
// // //       });
// // //     }

// // //     // Dessiner textes
// // //     for (const layer of textLayers) {
// // //       if (!layer.content) continue;
// // //       ctx.save();
// // //       const x = (layer.x / 100) * width;
// // //       const y = (layer.y / 100) * height;
// // //       ctx.translate(x, y);
// // //       ctx.rotate((layer.rotation * Math.PI) / 180);
// // //       ctx.globalAlpha = layer.opacity;

// // //       const fontStr = `${layer.italic ? "italic " : ""}${layer.bold ? "bold " : ""}${layer.fontSize}px "${layer.fontFamily}"`;
// // //       ctx.font = fontStr;
// // //       ctx.textAlign = layer.align as CanvasTextAlign;
// // //       ctx.textBaseline = "middle";

// // //       // Background du texte
// // //       if (layer.backgroundColor) {
// // //         const metrics = ctx.measureText(layer.content);
// // //         const pad = layer.backgroundPadding ?? 8;
// // //         const bw = metrics.width + pad * 2;
// // //         const bh = layer.fontSize + pad * 2;
// // //         const bx = layer.align === "center" ? -bw / 2 : layer.align === "right" ? -bw : 0;
// // //         ctx.fillStyle = layer.backgroundColor;
// // //         const r = layer.backgroundRadius ?? 6;
// // //         ctx.beginPath();
// // //         ctx.roundRect(bx - pad, -bh / 2, bw, bh, r);
// // //         ctx.fill();
// // //       }

// // //       // Ombre portée légère
// // //       ctx.shadowColor = "rgba(0,0,0,0.5)";
// // //       ctx.shadowBlur = 4;
// // //       ctx.shadowOffsetX = 1;
// // //       ctx.shadowOffsetY = 1;
// // //       ctx.fillStyle = layer.color;
// // //       ctx.fillText(layer.content, 0, 0);
// // //       ctx.restore();
// // //     }

// // //     return canvas.toDataURL("image/png");
// // //   }, []);

// // //   return { exportPoster };
// // // }

// // // // ─── FIX 2 : Placement intelligent des éléments selon le format ──────────────

// // // /**
// // //  * Calcule les positions et tailles optimales des couches texte
// // //  * selon le format de l'affiche (portrait, paysage, carré).
// // //  * Zones : slogan=haut-centre, prix=haut-droite, promo=milieu, cta=bas-centre
// // //  */
// // // function getSmartLayout(format: string): {
// // //   slogan:  { x: number; y: number; fontSize: number };
// // //   price:   { x: number; y: number; fontSize: number };
// // //   promo:   { x: number; y: number; fontSize: number };
// // //   cta:     { x: number; y: number; fontSize: number };
// // // } {
// // //   // Portrait 9:16 (stories, téléphone)
// // //   if (format === "9:16") {
// // //     return {
// // //       slogan: { x: 50, y: 12,  fontSize: 36 },
// // //       price:  { x: 82, y: 82,  fontSize: 32 },
// // //       promo:  { x: 50, y: 35,  fontSize: 26 },
// // //       cta:    { x: 50, y: 91,  fontSize: 20 },
// // //     };
// // //   }
// // //   // Paysage 16:9 (bannière, desktop)
// // //   if (format === "16:9") {
// // //     return {
// // //       slogan: { x: 50, y: 14,  fontSize: 34 },
// // //       price:  { x: 88, y: 75,  fontSize: 30 },
// // //       promo:  { x: 30, y: 55,  fontSize: 24 },
// // //       cta:    { x: 50, y: 88,  fontSize: 19 },
// // //     };
// // //   }
// // //   // Portrait doux 3:4
// // //   if (format === "3:4") {
// // //     return {
// // //       slogan: { x: 50, y: 13,  fontSize: 38 },
// // //       price:  { x: 82, y: 80,  fontSize: 34 },
// // //       promo:  { x: 50, y: 38,  fontSize: 27 },
// // //       cta:    { x: 50, y: 90,  fontSize: 21 },
// // //     };
// // //   }
// // //   // Paysage doux 4:3
// // //   if (format === "4:3") {
// // //     return {
// // //       slogan: { x: 50, y: 13,  fontSize: 36 },
// // //       price:  { x: 85, y: 78,  fontSize: 32 },
// // //       promo:  { x: 35, y: 52,  fontSize: 25 },
// // //       cta:    { x: 50, y: 89,  fontSize: 20 },
// // //     };
// // //   }
// // //   // Carré 1:1 (par défaut)
// // //   return {
// // //     slogan: { x: 50, y: 13,  fontSize: 40 },
// // //     price:  { x: 83, y: 80,  fontSize: 34 },
// // //     promo:  { x: 50, y: 38,  fontSize: 28 },
// // //     cta:    { x: 50, y: 90,  fontSize: 22 },
// // //   };
// // // }

// // // // ─── TextLayerCard ────────────────────────────────────────────────────────────

// // // const TextLayerCard: React.FC<{
// // //   layer: TextLayer;
// // //   selected: boolean;
// // //   onSelect: () => void;
// // //   onChange: (l: TextLayer) => void;
// // //   onDelete: () => void;
// // // }> = ({ layer, selected, onSelect, onChange, onDelete }) => {
// // //   const [expanded, setExpanded] = useState(selected);
// // //   useEffect(() => { if (selected) setExpanded(true); }, [selected]);

// // //   const set = (updates: Partial<TextLayer>) => onChange({ ...layer, ...updates });

// // //   const typeLabel: Record<TextLayer["type"], string> = {
// // //     slogan: "Slogan", price: "Prix", promo: "Promo", cta: "CTA", custom: "Texte libre",
// // //   };
// // //   const typeColor: Record<TextLayer["type"], string> = {
// // //     slogan: "bg-violet-100 text-violet-700",
// // //     price:  "bg-emerald-100 text-emerald-700",
// // //     promo:  "bg-orange-100 text-orange-700",
// // //     cta:    "bg-blue-100 text-blue-700",
// // //     custom: "bg-slate-100 text-slate-700",
// // //   };

// // //   return (
// // //     <div
// // //       className={`rounded-2xl border transition-all ${selected ? "border-blue-400 shadow-md shadow-blue-100" : "border-slate-200"}`}
// // //       onClick={onSelect}
// // //     >
// // //       {/* Header */}
// // //       <div className="flex items-center gap-2 p-3">
// // //         <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeColor[layer.type]}`}>
// // //           {typeLabel[layer.type]}
// // //         </span>
// // //         <span className="flex-1 text-xs font-medium text-slate-700 truncate">
// // //           {layer.content || <span className="text-slate-400 italic">Vide</span>}
// // //         </span>
// // //         <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} className="text-slate-400 hover:text-slate-600">
// // //           {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
// // //         </button>
// // //         <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600">
// // //           <Trash2 className="w-3.5 h-3.5" />
// // //         </button>
// // //       </div>

// // //       {/* Corps éditable */}
// // //       {expanded && (
// // //         <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3" onClick={e => e.stopPropagation()}>
// // //           {/* Contenu */}
// // //           <input
// // //             className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
// // //             placeholder="Contenu du texte..."
// // //             value={layer.content}
// // //             onChange={e => set({ content: e.target.value })}
// // //           />

// // //           {/* Police & taille */}
// // //           <div className="grid grid-cols-2 gap-2">
// // //             <div>
// // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Police</p>
// // //               <select className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none"
// // //                 value={layer.fontFamily} onChange={e => set({ fontFamily: e.target.value })}>
// // //                 {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
// // //               </select>
// // //             </div>
// // //             <div>
// // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille</p>
// // //               <div className="flex items-center gap-1">
// // //                 <input type="number" min={10} max={200}
// // //                   className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none"
// // //                   value={layer.fontSize} onChange={e => set({ fontSize: Number(e.target.value) })} />
// // //                 <span className="text-[10px] text-slate-400">px</span>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Couleur & style */}
// // //           <div className="flex items-center gap-3">
// // //             <div className="flex items-center gap-1.5">
// // //               <input type="color" value={layer.color} onChange={e => set({ color: e.target.value })}
// // //                 className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
// // //               <span className="text-[10px] text-slate-500 font-mono">{layer.color}</span>
// // //             </div>
// // //             <div className="flex gap-1 ml-auto">
// // //               <button onClick={() => set({ bold: !layer.bold })}
// // //                 className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${layer.bold ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// // //                 <Bold className="w-3 h-3" />
// // //               </button>
// // //               <button onClick={() => set({ italic: !layer.italic })}
// // //                 className={`w-7 h-7 rounded-lg text-xs italic flex items-center justify-center transition-all ${layer.italic ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// // //                 <Italic className="w-3 h-3" />
// // //               </button>
// // //               {(["left", "center", "right"] as TextAlign[]).map(a => (
// // //                 <button key={a} onClick={() => set({ align: a })}
// // //                   className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${layer.align === a ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// // //                   {a === "left" ? <AlignLeft className="w-3 h-3" /> : a === "center" ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
// // //                 </button>
// // //               ))}
// // //             </div>
// // //           </div>

// // //           {/* Position */}
// // //           <div className="grid grid-cols-2 gap-2">
// // //             <div>
// // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position X (%)</p>
// // //               <input type="range" min={0} max={100} value={layer.x} onChange={e => set({ x: Number(e.target.value) })}
// // //                 className="w-full accent-blue-500" />
// // //               <span className="text-[10px] text-slate-500 font-mono">{layer.x}%</span>
// // //             </div>
// // //             <div>
// // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position Y (%)</p>
// // //               <input type="range" min={0} max={100} value={layer.y} onChange={e => set({ y: Number(e.target.value) })}
// // //                 className="w-full accent-blue-500" />
// // //               <span className="text-[10px] text-slate-500 font-mono">{layer.y}%</span>
// // //             </div>
// // //           </div>

// // //           {/* Rotation & Opacité */}
// // //           <div className="grid grid-cols-2 gap-2">
// // //             <div>
// // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rotation</p>
// // //               <div className="flex items-center gap-1">
// // //                 <input type="range" min={-180} max={180} value={layer.rotation} onChange={e => set({ rotation: Number(e.target.value) })}
// // //                   className="flex-1 accent-blue-500" />
// // //                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{layer.rotation}°</span>
// // //               </div>
// // //             </div>
// // //             <div>
// // //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
// // //               <div className="flex items-center gap-1">
// // //                 <input type="range" min={0} max={1} step={0.05} value={layer.opacity} onChange={e => set({ opacity: Number(e.target.value) })}
// // //                   className="flex-1 accent-blue-500" />
// // //                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Fond du texte */}
// // //           <div>
// // //             <div className="flex items-center justify-between mb-1.5">
// // //               <p className="text-[9px] font-black text-slate-400 uppercase">Fond du texte</p>
// // //               <button
// // //                 onClick={() => set({ backgroundColor: layer.backgroundColor ? undefined : "rgba(0,0,0,0.5)" })}
// // //                 className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${layer.backgroundColor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
// // //                 {layer.backgroundColor ? "Activé" : "Désactivé"}
// // //               </button>
// // //             </div>
// // //             {layer.backgroundColor && (
// // //               <div className="flex items-center gap-2">
// // //                 <input type="color" value={layer.backgroundColor.startsWith("rgba") ? "#000000" : layer.backgroundColor}
// // //                   onChange={e => set({ backgroundColor: e.target.value + "99" })}
// // //                   className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
// // //                 <input type="range" min={0} max={20} value={layer.backgroundPadding ?? 8}
// // //                   onChange={e => set({ backgroundPadding: Number(e.target.value) })}
// // //                   className="flex-1 accent-blue-500" />
// // //                 <span className="text-[10px] text-slate-400">padding</span>
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // // ─── Page Résultats + Éditeur ─────────────────────────────────────────────────

// // // const ResultsPage: React.FC = () => {
// // //   const location = useLocation();
// // //   const navigate = useNavigate();
// // //   const { exportPoster } = usePosterExport();

// // //   const poster: PosterData | undefined = location.state?.poster;
// // //   const analysis = location.state?.analysis;

// // //   const [editorState, setEditorState] = useState<PostEditorState>(DEFAULT_POST_EDITOR);
// // //   const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
// // //   const [activePanel, setActivePanel] = useState<"layers" | "adjust" | "logo">("layers");
// // //   const [exporting, setExporting] = useState(false);
// // //   const [exported, setExported] = useState(false);
// // //   const [currentFormat, setCurrentFormat] = useState<string>(poster?.format ?? "1:1");

// // //   const logoInputRef = useRef<HTMLInputElement>(null);
// // //   const previewRef = useRef<HTMLDivElement>(null);

// // //   // ── Recalculer les positions texte quand le format change ───────────────────
// // //   const handleFormatChange = useCallback((newFormat: string) => {
// // //     setCurrentFormat(newFormat);
// // //     const layout = getSmartLayout(newFormat);
// // //     setEditorState(prev => ({
// // //       ...prev,
// // //       textLayers: prev.textLayers.map(layer => {
// // //         const pos = layout[layer.type as keyof ReturnType<typeof getSmartLayout>];
// // //         if (!pos) return layer; // type "custom" → position non touchée
// // //         return { ...layer, x: pos.x, y: pos.y, fontSize: pos.fontSize };
// // //       }),
// // //     }));
// // //   }, []);

// // //   // ── Initialiser les couches texte avec placement intelligent ────────────────
// // //   useEffect(() => {
// // //     if (!poster || !analysis) return;

// // //     // Récupérer le layout intelligent selon le format initial
// // //     const layout = getSmartLayout(poster.format);

// // //     const layers: TextLayer[] = [];

// // //     // Slogan — zone haute, centré, très visible
// // //     if (analysis.slogan) {
// // //       layers.push({
// // //         id: generateId(),
// // //         type: "slogan",
// // //         content: analysis.slogan,
// // //         x: layout.slogan.x,
// // //         y: layout.slogan.y,
// // //         fontSize: layout.slogan.fontSize,
// // //         fontFamily: "Impact",
// // //         color: "#FFFFFF",
// // //         bold: true,
// // //         italic: false,
// // //         align: "center",
// // //         rotation: 0,
// // //         opacity: 1,
// // //         backgroundColor: "rgba(0,0,0,0.45)",
// // //         backgroundPadding: 14,
// // //         backgroundRadius: 10,
// // //       });
// // //     }

// // //     // Prix — zone basse-droite, badge doré bien visible
// // //     if (analysis.generatedPrice) {
// // //       layers.push({
// // //         id: generateId(),
// // //         type: "price",
// // //         content: analysis.generatedPrice,
// // //         x: layout.price.x,
// // //         y: layout.price.y,
// // //         fontSize: layout.price.fontSize,
// // //         fontFamily: "Arial",
// // //         color: "#FFD700",
// // //         bold: true,
// // //         italic: false,
// // //         align: "center",
// // //         rotation: 0,
// // //         opacity: 1,
// // //         backgroundColor: "rgba(0,0,0,0.65)",
// // //         backgroundPadding: 12,
// // //         backgroundRadius: 50,
// // //       });
// // //     }

// // //     // Promo — zone milieu, légèrement incliné pour dynamisme
// // //     if (analysis.generatedPromo) {
// // //       layers.push({
// // //         id: generateId(),
// // //         type: "promo",
// // //         content: analysis.generatedPromo,
// // //         x: layout.promo.x,
// // //         y: layout.promo.y,
// // //         fontSize: layout.promo.fontSize,
// // //         fontFamily: "Arial",
// // //         color: "#FF4444",
// // //         bold: true,
// // //         italic: false,
// // //         align: "center",
// // //         rotation: -4,
// // //         opacity: 1,
// // //         backgroundColor: "#FFFFFF",
// // //         backgroundPadding: 11,
// // //         backgroundRadius: 6,
// // //       });
// // //     }

// // //     // CTA — zone basse, centré, bouton arrondi bleu
// // //     if (analysis.generatedCta) {
// // //       layers.push({
// // //         id: generateId(),
// // //         type: "cta",
// // //         content: analysis.generatedCta,
// // //         x: layout.cta.x,
// // //         y: layout.cta.y,
// // //         fontSize: layout.cta.fontSize,
// // //         fontFamily: "Arial",
// // //         color: "#FFFFFF",
// // //         bold: true,
// // //         italic: false,
// // //         align: "center",
// // //         rotation: 0,
// // //         opacity: 1,
// // //         backgroundColor: "#2563EB",
// // //         backgroundPadding: 15,
// // //         backgroundRadius: 50,
// // //       });
// // //     }

// // //     setEditorState(prev => ({ ...prev, textLayers: layers }));
// // //   }, [poster, analysis]);

// // //   if (!poster) {
// // //     return (
// // //       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
// // //         <p className="text-slate-500">Aucun poster à afficher.</p>
// // //         <button onClick={() => navigate("/")} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">
// // //           Retour au générateur
// // //         </button>
// // //       </div>
// // //     );
// // //   }

// // //   // Dimensions affiche selon format
// // //   const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
// // //     "1:1":  { w: 512, h: 512 },
// // //     "9:16": { w: 360, h: 640 },
// // //     "16:9": { w: 640, h: 360 },
// // //     "4:3":  { w: 512, h: 384 },
// // //     "3:4":  { w: 384, h: 512 },
// // //   };
// // //   const dims = FORMAT_DIMS[currentFormat] ?? { w: 512, h: 512 };

// // //   const { textLayers, logoLayer, adjustments } = editorState;

// // //   const setAdj = (key: keyof ImageAdjustments, value: number) =>
// // //     setEditorState(prev => ({ ...prev, adjustments: { ...prev.adjustments, [key]: value } }));

// // //   const addTextLayer = () => {
// // //     const layer: TextLayer = {
// // //       id: generateId(),
// // //       type: "custom",
// // //       content: "Nouveau texte",
// // //       x: 50, y: 50,
// // //       fontSize: 32,
// // //       fontFamily: "Arial",
// // //       color: "#FFFFFF",
// // //       bold: false,
// // //       italic: false,
// // //       align: "center",
// // //       rotation: 0,
// // //       opacity: 1,
// // //     };
// // //     setEditorState(prev => ({ ...prev, textLayers: [...prev.textLayers, layer] }));
// // //     setSelectedLayerId(layer.id);
// // //   };

// // //   const updateLayer = (id: string, updated: TextLayer) =>
// // //     setEditorState(prev => ({
// // //       ...prev,
// // //       textLayers: prev.textLayers.map(l => l.id === id ? updated : l),
// // //     }));

// // //   const deleteLayer = (id: string) =>
// // //     setEditorState(prev => ({
// // //       ...prev,
// // //       textLayers: prev.textLayers.filter(l => l.id !== id),
// // //     }));

// // //   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// // //     const file = e.target.files?.[0];
// // //     if (!file) return;
// // //     const reader = new FileReader();
// // //     reader.onloadend = () => {
// // //       const logo: LogoLayer = {
// // //         id: generateId(),
// // //         src: reader.result as string,
// // //         x: 5, y: 5,
// // //         width: 20,
// // //         opacity: 1,
// // //       };
// // //       setEditorState(prev => ({ ...prev, logoLayer: logo }));
// // //     };
// // //     reader.readAsDataURL(file);
// // //     if (logoInputRef.current) logoInputRef.current.value = "";
// // //   };

// // //   const handleExport = async () => {
// // //     setExporting(true);
// // //     try {
// // //       const exportW = 1024;
// // //       const exportH = Math.round(exportW * (dims.h / dims.w));
// // //       const dataUrl = await exportPoster(
// // //         poster.imageUrl, textLayers, logoLayer, adjustments, exportW, exportH
// // //       );
// // //       const a = document.createElement("a");
// // //       a.href = dataUrl;
// // //       a.download = `affiche-${poster.id}.png`;
// // //       a.click();
// // //       setExported(true);
// // //       setTimeout(() => setExported(false), 3000);
// // //     } catch (err) {
// // //       console.error("Export:", err);
// // //       alert("Erreur lors de l'export.");
// // //     } finally {
// // //       setExporting(false);
// // //     }
// // //   };

// // //   // Filtre CSS pour la prévisualisation
// // //   const previewFilter = [
// // //     adjustments.brightness !== 0 ? `brightness(${1 + adjustments.brightness / 100})` : "",
// // //     adjustments.contrast !== 0 ? `contrast(${1 + adjustments.contrast / 100})` : "",
// // //     adjustments.saturation !== 0 ? `saturate(${1 + adjustments.saturation / 100})` : "",
// // //     adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
// // //   ].filter(Boolean).join(" ") || "none";

// // //   const hasProductImage = poster.customization.userImages.some(i => i.role === "product");

// // //   // ── FIX 2 : Échelle de police adaptée à la taille de prévisualisation ────────
// // //   // Base de référence : 512px de largeur
// // //   const fontScale = dims.w / 512;

// // //   return (
// // //     <div className="max-w-7xl mx-auto px-4 py-8">

// // //       {/* Header */}
// // //       <div className="flex items-center justify-between mb-6">
// // //         <div className="flex items-center gap-3">
// // //           <button onClick={() => navigate(-1)}
// // //             className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
// // //             <ArrowLeft className="w-4 h-4 text-slate-600" />
// // //           </button>
// // //           <div>
// // //             <h1 className="text-2xl font-black text-slate-900">Éditeur Post-Génération</h1>
// // //             <p className="text-xs text-slate-500 mt-0.5">
// // //               {hasProductImage
// // //                 ? "Mode 1 · Image fournie comme fond · Éditez les textes superposés"
// // //                 : "Mode 2 · Image générée · Éditez les textes et ajustements"}
// // //             </p>
// // //           </div>
// // //         </div>
// // //         <button
// // //           onClick={handleExport}
// // //           disabled={exporting}
// // //           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${
// // //             exported
// // //               ? "bg-emerald-500 text-white"
// // //               : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
// // //           }`}
// // //         >
// // //           {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
// // //           {exporting ? "Export..." : exported ? "Téléchargé !" : "Exporter HD"}
// // //         </button>
// // //       </div>

// // //       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

// // //         {/* ════ PRÉVISUALISATION ════ */}
// // //         <div className="lg:col-span-6 flex flex-col items-center">

// // //           {/* Sélecteur de format en post-édition */}
// // //           <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
// // //             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Format :</span>
// // //             {(["1:1","9:16","16:9","4:3","3:4"] as const).map(f => (
// // //               <button
// // //                 key={f}
// // //                 onClick={() => handleFormatChange(f)}
// // //                 className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
// // //                   currentFormat === f
// // //                     ? "bg-blue-600 text-white border-transparent shadow"
// // //                     : "border-slate-200 text-slate-500 hover:border-slate-400"
// // //                 }`}
// // //               >
// // //                 {f}
// // //               </button>
// // //             ))}
// // //           </div>

// // //           <div
// // //             ref={previewRef}
// // //             className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-200"
// // //             style={{
// // //               width: dims.w,
// // //               height: dims.h,
// // //               maxWidth: "100%",
// // //             }}
// // //           >
// // //             {/* Image couvre tout le format sans espaces noirs */}
// // //             <img
// // //               src={poster.imageUrl}
// // //               alt="Affiche"
// // //               className="absolute inset-0 w-full h-full"
// // //               style={{
// // //                 objectFit: "cover",
// // //                 objectPosition: "center center",
// // //                 filter: previewFilter,
// // //               }}
// // //               draggable={false}
// // //             />

// // //             {/* Logo */}
// // //             {logoLayer && (
// // //               <div
// // //                 className="absolute cursor-move select-none"
// // //                 style={{
// // //                   left: `${logoLayer.x}%`,
// // //                   top: `${logoLayer.y}%`,
// // //                   width: `${logoLayer.width}%`,
// // //                   opacity: logoLayer.opacity,
// // //                 }}
// // //               >
// // //                 <img src={logoLayer.src} alt="Logo" className="w-full" draggable={false} />
// // //               </div>
// // //             )}

// // //             {/* ── FIX 2 : Couches texte avec fontSize scalée au format ── */}
// // //             {textLayers.map(layer => (
// // //               <div
// // //                 key={layer.id}
// // //                 onClick={() => setSelectedLayerId(layer.id)}
// // //                 className={`absolute select-none transition-all ${selectedLayerId === layer.id ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
// // //                 style={{
// // //                   left: `${layer.x}%`,
// // //                   top: `${layer.y}%`,
// // //                   transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
// // //                   opacity: layer.opacity,
// // //                   cursor: "pointer",
// // //                   fontFamily: layer.fontFamily,
// // //                   // ── FIX 2 : fontSize scalée proportionnellement au format ──
// // //                   fontSize: `${layer.fontSize * fontScale}px`,
// // //                   color: layer.color,
// // //                   fontWeight: layer.bold ? "bold" : "normal",
// // //                   fontStyle: layer.italic ? "italic" : "normal",
// // //                   textAlign: layer.align,
// // //                   whiteSpace: "nowrap",
// // //                   textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
// // //                   backgroundColor: layer.backgroundColor,
// // //                   padding: layer.backgroundColor
// // //                     ? `${(layer.backgroundPadding ?? 8) * fontScale}px ${(layer.backgroundPadding ?? 8) * 1.5 * fontScale}px`
// // //                     : undefined,
// // //                   borderRadius: layer.backgroundColor ? `${layer.backgroundRadius ?? 6}px` : undefined,
// // //                 }}
// // //               >
// // //                 {layer.content}
// // //               </div>
// // //             ))}
// // //           </div>

// // //           {/* Info mode */}
// // //           <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
// // //             hasProductImage
// // //               ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
// // //               : "bg-blue-50 text-blue-700 border border-blue-100"
// // //           }`}>
// // //             {hasProductImage ? <ImageIcon className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
// // //             {hasProductImage
// // //               ? "Image produit utilisée comme fond · Sans modification"
// // //               : "Affiche générée par IA · Textes superposés"}
// // //           </div>

// // //           {/* Hashtags */}
// // //           {analysis?.hashtags && analysis.hashtags.length > 0 && (
// // //             <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
// // //               {analysis.hashtags.map((tag: string) => (
// // //                 <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium">
// // //                   #{tag}
// // //                 </span>
// // //               ))}
// // //             </div>
// // //           )}
// // //         </div>

// // //         {/* ════ PANNEAU ÉDITION ════ */}
// // //         <div className="lg:col-span-6 space-y-4">

// // //           {/* Onglets panneau */}
// // //           <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
// // //             {([
// // //               { id: "layers", label: "Textes", icon: <Type className="w-4 h-4" /> },
// // //               { id: "adjust", label: "Réglages", icon: <Sliders className="w-4 h-4" /> },
// // //               { id: "logo",   label: "Logo",    icon: <ImageIcon className="w-4 h-4" /> },
// // //             ] as { id: typeof activePanel; label: string; icon: React.ReactNode }[]).map(tab => (
// // //               <button
// // //                 key={tab.id}
// // //                 onClick={() => setActivePanel(tab.id)}
// // //                 className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
// // //                   activePanel === tab.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
// // //                 }`}
// // //               >
// // //                 {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
// // //               </button>
// // //             ))}
// // //           </div>

// // //           {/* ── Panel: TEXTES ── */}
// // //           {activePanel === "layers" && (
// // //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-3">
// // //               <div className="flex items-center justify-between">
// // //                 <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// // //                   <Type className="w-4 h-4" /> Couches de texte
// // //                 </h3>
// // //                 <button
// // //                   onClick={addTextLayer}
// // //                   className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
// // //                 >
// // //                   <Plus className="w-3.5 h-3.5" /> Ajouter
// // //                 </button>
// // //               </div>

// // //               {textLayers.length === 0 ? (
// // //                 <div className="py-8 text-center">
// // //                   <Type className="w-8 h-8 text-slate-200 mx-auto mb-3" />
// // //                   <p className="text-sm text-slate-400 font-medium">Aucune couche texte</p>
// // //                   <p className="text-xs text-slate-300 mt-1">Cliquez "Ajouter" pour créer un texte</p>
// // //                 </div>
// // //               ) : (
// // //                 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
// // //                   {textLayers.map(layer => (
// // //                     <TextLayerCard
// // //                       key={layer.id}
// // //                       layer={layer}
// // //                       selected={selectedLayerId === layer.id}
// // //                       onSelect={() => setSelectedLayerId(layer.id)}
// // //                       onChange={updated => updateLayer(layer.id, updated)}
// // //                       onDelete={() => {
// // //                         deleteLayer(layer.id);
// // //                         if (selectedLayerId === layer.id) setSelectedLayerId(null);
// // //                       }}
// // //                     />
// // //                   ))}
// // //                 </div>
// // //               )}

// // //               <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
// // //                 Cliquez sur un texte dans la prévisualisation pour le sélectionner
// // //               </p>
// // //             </div>
// // //           )}

// // //           {/* ── Panel: RÉGLAGES IMAGE ── */}
// // //           {activePanel === "adjust" && (
// // //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-5">
// // //               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// // //                 <Sliders className="w-4 h-4" /> Réglages de l'image
// // //               </h3>

// // //               {[
// // //                 { key: "brightness" as const, label: "Luminosité", icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
// // //                 { key: "contrast"   as const, label: "Contraste",  icon: <Contrast className="w-4 h-4" />, min: -100, max: 100 },
// // //                 { key: "saturation" as const, label: "Saturation", icon: <Droplets className="w-4 h-4" />, min: -100, max: 100 },
// // //                 { key: "blur"       as const, label: "Flou",       icon: <Wind className="w-4 h-4" />, min: 0, max: 20 },
// // //               ].map(({ key, label, icon, min, max }) => (
// // //                 <div key={key}>
// // //                   <div className="flex items-center justify-between mb-2">
// // //                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
// // //                       <span className="text-slate-400">{icon}</span>
// // //                       {label}
// // //                     </div>
// // //                     <div className="flex items-center gap-2">
// // //                       <span className="text-xs font-mono text-slate-500 w-10 text-right">{adjustments[key]}</span>
// // //                       <button
// // //                         onClick={() => setAdj(key, 0)}
// // //                         className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
// // //                       >
// // //                         Reset
// // //                       </button>
// // //                     </div>
// // //                   </div>
// // //                   <input
// // //                     type="range" min={min} max={max} value={adjustments[key]}
// // //                     onChange={e => setAdj(key, Number(e.target.value))}
// // //                     className="w-full accent-blue-500"
// // //                   />
// // //                   <div className="flex justify-between mt-0.5">
// // //                     <span className="text-[9px] text-slate-300">{min}</span>
// // //                     <span className="text-[9px] text-slate-300">{max}</span>
// // //                   </div>
// // //                 </div>
// // //               ))}

// // //               <button
// // //                 onClick={() => setEditorState(prev => ({ ...prev, adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 } }))}
// // //                 className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-2"
// // //               >
// // //                 <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser tous les réglages
// // //               </button>
// // //             </div>
// // //           )}

// // //           {/* ── Panel: LOGO ── */}
// // //           {activePanel === "logo" && (
// // //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-4">
// // //               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// // //                 <ImageIcon className="w-4 h-4" /> Logo de marque
// // //               </h3>

// // //               {!logoLayer ? (
// // //                 <button
// // //                   onClick={() => logoInputRef.current?.click()}
// // //                   className="w-full py-10 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl transition-all flex flex-col items-center gap-3 group"
// // //                 >
// // //                   <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
// // //                     <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
// // //                   </div>
// // //                   <div className="text-center">
// // //                     <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Ajouter votre logo</p>
// // //                     <p className="text-[10px] text-slate-400 mt-0.5">PNG avec transparence recommandé</p>
// // //                   </div>
// // //                 </button>
// // //               ) : (
// // //                 <div className="space-y-4">
// // //                   {/* Aperçu */}
// // //                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
// // //                     <img src={logoLayer.src} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-100" />
// // //                     <div className="flex-1">
// // //                       <p className="text-xs font-black text-slate-700">Logo chargé</p>
// // //                       <p className="text-[10px] text-slate-400">Ajustez la position et la taille ci-dessous</p>
// // //                     </div>
// // //                     <button onClick={() => setEditorState(prev => ({ ...prev, logoLayer: null }))}
// // //                       className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center">
// // //                       <X className="w-3.5 h-3.5" />
// // //                     </button>
// // //                   </div>

// // //                   {/* Position X/Y */}
// // //                   <div className="grid grid-cols-2 gap-3">
// // //                     {([
// // //                       { key: "x" as const, label: "Position X (%)" },
// // //                       { key: "y" as const, label: "Position Y (%)" },
// // //                     ]).map(({ key, label }) => (
// // //                       <div key={key}>
// // //                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
// // //                         <input type="range" min={0} max={90} value={logoLayer[key]}
// // //                           onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, [key]: Number(e.target.value) } : null }))}
// // //                           className="w-full accent-blue-500" />
// // //                         <span className="text-[10px] font-mono text-slate-500">{logoLayer[key]}%</span>
// // //                       </div>
// // //                     ))}
// // //                   </div>

// // //                   {/* Taille & Opacité */}
// // //                   <div className="grid grid-cols-2 gap-3">
// // //                     <div>
// // //                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille (%)</p>
// // //                       <input type="range" min={5} max={50} value={logoLayer.width}
// // //                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, width: Number(e.target.value) } : null }))}
// // //                         className="w-full accent-blue-500" />
// // //                       <span className="text-[10px] font-mono text-slate-500">{logoLayer.width}%</span>
// // //                     </div>
// // //                     <div>
// // //                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
// // //                       <input type="range" min={0.1} max={1} step={0.05} value={logoLayer.opacity}
// // //                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, opacity: Number(e.target.value) } : null }))}
// // //                         className="w-full accent-blue-500" />
// // //                       <span className="text-[10px] font-mono text-slate-500">{Math.round(logoLayer.opacity * 100)}%</span>
// // //                     </div>
// // //                   </div>

// // //                   <button onClick={() => logoInputRef.current?.click()}
// // //                     className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
// // //                     Changer le logo
// // //                   </button>
// // //                 </div>
// // //               )}
// // //             </div>
// // //           )}

// // //           {/* Copier le texte marketing */}
// // //           {analysis?.marketingCopy && (
// // //             <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
// // //               <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Texte marketing généré</p>
// // //               <p className="text-sm text-slate-700 leading-relaxed">{analysis.marketingCopy}</p>
// // //               <button
// // //                 onClick={() => navigator.clipboard.writeText(analysis.marketingCopy)}
// // //                 className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
// // //               >
// // //                 <Copy className="w-3 h-3" /> Copier
// // //               </button>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </div>

// // //       <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
// // //     </div>
// // //   );
// // // };

// // // export default ResultsPage;


// // import React, { useState, useRef, useCallback, useEffect } from "react";
// // import { useLocation, useNavigate } from "react-router-dom";
// // import {
// //   Download, ArrowLeft, Plus, Trash2, Move, Type,
// //   Sun, Contrast, Droplets, Wind, Image as ImageIcon,
// //   Bold, Italic, AlignLeft, AlignCenter, AlignRight,
// //   RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp,
// //   Layers, Palette, Sliders, Check, X, Copy,
// // } from "lucide-react";
// // import {
// //   PosterData, TextLayer, LogoLayer, ImageAdjustments,
// //   PostEditorState, DEFAULT_POST_EDITOR, TextAlign,
// // } from "../types";

// // // ─── Polices disponibles ──────────────────────────────────────────────────────

// // const FONTS = [
// //   "Arial", "Georgia", "Impact", "Helvetica",
// //   "Times New Roman", "Verdana", "Trebuchet MS",
// //   "Courier New", "Palatino", "Tahoma",
// // ];

// // function generateId() { return Math.random().toString(36).substr(2, 9); }

// // // ─── Hook canvas export ───────────────────────────────────────────────────────

// // function usePosterExport() {
// //   const exportPoster = useCallback(async (
// //     imageUrl: string,
// //     textLayers: TextLayer[],
// //     logoLayer: LogoLayer | null,
// //     adjustments: ImageAdjustments,
// //     width: number,
// //     height: number,
// //     previewWidth: number
// //   ): Promise<string> => {
// //     const canvas = document.createElement("canvas");
// //     canvas.width = width;
// //     canvas.height = height;
// //     const ctx = canvas.getContext("2d")!;

// //     // Charger image de fond
// //     await new Promise<void>((resolve, reject) => {
// //       const img = new Image();
// //       img.crossOrigin = "anonymous";
// //       img.onload = () => {
// //         ctx.filter = [
// //           `brightness(${1 + adjustments.brightness / 100})`,
// //           `contrast(${1 + adjustments.contrast / 100})`,
// //           `saturate(${1 + adjustments.saturation / 100})`,
// //           adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
// //         ].filter(Boolean).join(" ");

// //         // object-cover : l'image remplit tout le canvas sans espaces, recadrage centré
// //         const imgAspect = img.naturalWidth / img.naturalHeight;
// //         const canvasAspect = width / height;
// //         let sx: number, sy: number, sw: number, sh: number;
// //         if (imgAspect > canvasAspect) {
// //           // Image plus large que le canvas : crop horizontal centré
// //           sh = img.naturalHeight;
// //           sw = img.naturalHeight * canvasAspect;
// //           sx = (img.naturalWidth - sw) / 2;
// //           sy = 0;
// //         } else {
// //           // Image plus haute que le canvas : crop vertical centré
// //           sw = img.naturalWidth;
// //           sh = img.naturalWidth / canvasAspect;
// //           sx = 0;
// //           sy = (img.naturalHeight - sh) / 2;
// //         }
// //         ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
// //         ctx.filter = "none";
// //         resolve();
// //       };
// //       img.onerror = reject;
// //       img.src = imageUrl;
// //     });

// //     // Dessiner logo
// //     if (logoLayer) {
// //       await new Promise<void>((resolve) => {
// //         const img = new Image();
// //         img.crossOrigin = "anonymous";
// //         img.onload = () => {
// //           const logoW = (logoLayer.width / 100) * width;
// //           const logoH = (logoW / img.naturalWidth) * img.naturalHeight;
// //           ctx.globalAlpha = logoLayer.opacity;
// //           ctx.drawImage(img, (logoLayer.x / 100) * width, (logoLayer.y / 100) * height, logoW, logoH);
// //           ctx.globalAlpha = 1;
// //           resolve();
// //         };
// //         img.onerror = () => resolve();
// //         img.src = logoLayer.src;
// //       });
// //     }

// //     // Dessiner textes
// //     for (const layer of textLayers) {
// //       if (!layer.content) continue;
// //       ctx.save();
// //       const x = (layer.x / 100) * width;
// //       const y = (layer.y / 100) * height;
// //       ctx.translate(x, y);
// //       ctx.rotate((layer.rotation * Math.PI) / 180);
// //       ctx.globalAlpha = layer.opacity;

// //       // Scaler la fontSize proportionnellement à la taille d'export vs preview
// //       const exportFontSize = layer.fontSize * (width / previewWidth);
// //       const fontStr = `${layer.italic ? "italic " : ""}${layer.bold ? "bold " : ""}${exportFontSize}px "${layer.fontFamily}"`;
// //       ctx.font = fontStr;
// //       ctx.textAlign = layer.align as CanvasTextAlign;
// //       ctx.textBaseline = "middle";

// //       // Background du texte
// //       if (layer.backgroundColor) {
// //         const metrics = ctx.measureText(layer.content);
// //         const pad = (layer.backgroundPadding ?? 8) * (width / previewWidth);
// //         const bw = metrics.width + pad * 2;
// //         const bh = exportFontSize + pad * 2;
// //         const bx = layer.align === "center" ? -bw / 2 : layer.align === "right" ? -bw : 0;
// //         ctx.fillStyle = layer.backgroundColor;
// //         const r = layer.backgroundRadius ?? 6;
// //         ctx.beginPath();
// //         ctx.roundRect(bx - pad, -bh / 2, bw, bh, r);
// //         ctx.fill();
// //       }

// //       // Ombre portée légère
// //       ctx.shadowColor = "rgba(0,0,0,0.5)";
// //       ctx.shadowBlur = 4;
// //       ctx.shadowOffsetX = 1;
// //       ctx.shadowOffsetY = 1;
// //       ctx.fillStyle = layer.color;
// //       ctx.fillText(layer.content, 0, 0);
// //       ctx.restore();
// //     }

// //     return canvas.toDataURL("image/png");
// //   }, []);

// //   return { exportPoster };
// // }

// // // ─── FIX 2 : Placement intelligent des éléments selon le format ──────────────

// // /**
// //  * Calcule les positions et tailles optimales des couches texte
// //  * selon le format de l'affiche (portrait, paysage, carré).
// //  * Zones : slogan=haut-centre, prix=haut-droite, promo=milieu, cta=bas-centre
// //  */
// // function getSmartLayout(format: string): {
// //   slogan:  { x: number; y: number; fontSize: number };
// //   price:   { x: number; y: number; fontSize: number };
// //   promo:   { x: number; y: number; fontSize: number };
// //   cta:     { x: number; y: number; fontSize: number };
// // } {
// //   // Portrait 9:16 (stories, téléphone)
// //   if (format === "9:16") {
// //     return {
// //       slogan: { x: 50, y: 12,  fontSize: 36 },
// //       price:  { x: 82, y: 82,  fontSize: 32 },
// //       promo:  { x: 50, y: 35,  fontSize: 26 },
// //       cta:    { x: 50, y: 91,  fontSize: 20 },
// //     };
// //   }
// //   // Paysage 16:9 (bannière, desktop)
// //   if (format === "16:9") {
// //     return {
// //       slogan: { x: 50, y: 14,  fontSize: 34 },
// //       price:  { x: 88, y: 75,  fontSize: 30 },
// //       promo:  { x: 30, y: 55,  fontSize: 24 },
// //       cta:    { x: 50, y: 88,  fontSize: 19 },
// //     };
// //   }
// //   // Portrait doux 3:4
// //   if (format === "3:4") {
// //     return {
// //       slogan: { x: 50, y: 13,  fontSize: 38 },
// //       price:  { x: 82, y: 80,  fontSize: 34 },
// //       promo:  { x: 50, y: 38,  fontSize: 27 },
// //       cta:    { x: 50, y: 90,  fontSize: 21 },
// //     };
// //   }
// //   // Paysage doux 4:3
// //   if (format === "4:3") {
// //     return {
// //       slogan: { x: 50, y: 13,  fontSize: 36 },
// //       price:  { x: 85, y: 78,  fontSize: 32 },
// //       promo:  { x: 35, y: 52,  fontSize: 25 },
// //       cta:    { x: 50, y: 89,  fontSize: 20 },
// //     };
// //   }
// //   // Carré 1:1 (par défaut)
// //   return {
// //     slogan: { x: 50, y: 13,  fontSize: 40 },
// //     price:  { x: 83, y: 80,  fontSize: 34 },
// //     promo:  { x: 50, y: 38,  fontSize: 28 },
// //     cta:    { x: 50, y: 90,  fontSize: 22 },
// //   };
// // }

// // // ─── TextLayerCard ────────────────────────────────────────────────────────────

// // const TextLayerCard: React.FC<{
// //   layer: TextLayer;
// //   selected: boolean;
// //   onSelect: () => void;
// //   onChange: (l: TextLayer) => void;
// //   onDelete: () => void;
// // }> = ({ layer, selected, onSelect, onChange, onDelete }) => {
// //   const [expanded, setExpanded] = useState(selected);
// //   useEffect(() => { if (selected) setExpanded(true); }, [selected]);

// //   const set = (updates: Partial<TextLayer>) => onChange({ ...layer, ...updates });

// //   const typeLabel: Record<TextLayer["type"], string> = {
// //     slogan: "Slogan", price: "Prix", promo: "Promo", cta: "CTA", custom: "Texte libre",
// //   };
// //   const typeColor: Record<TextLayer["type"], string> = {
// //     slogan: "bg-violet-100 text-violet-700",
// //     price:  "bg-emerald-100 text-emerald-700",
// //     promo:  "bg-orange-100 text-orange-700",
// //     cta:    "bg-blue-100 text-blue-700",
// //     custom: "bg-slate-100 text-slate-700",
// //   };

// //   return (
// //     <div
// //       className={`rounded-2xl border transition-all ${selected ? "border-blue-400 shadow-md shadow-blue-100" : "border-slate-200"}`}
// //       onClick={onSelect}
// //     >
// //       {/* Header */}
// //       <div className="flex items-center gap-2 p-3">
// //         <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeColor[layer.type]}`}>
// //           {typeLabel[layer.type]}
// //         </span>
// //         <span className="flex-1 text-xs font-medium text-slate-700 truncate">
// //           {layer.content || <span className="text-slate-400 italic">Vide</span>}
// //         </span>
// //         <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} className="text-slate-400 hover:text-slate-600">
// //           {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
// //         </button>
// //         <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600">
// //           <Trash2 className="w-3.5 h-3.5" />
// //         </button>
// //       </div>

// //       {/* Corps éditable */}
// //       {expanded && (
// //         <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3" onClick={e => e.stopPropagation()}>
// //           {/* Contenu */}
// //           <input
// //             className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
// //             placeholder="Contenu du texte..."
// //             value={layer.content}
// //             onChange={e => set({ content: e.target.value })}
// //           />

// //           {/* Police & taille */}
// //           <div className="grid grid-cols-2 gap-2">
// //             <div>
// //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Police</p>
// //               <select className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none"
// //                 value={layer.fontFamily} onChange={e => set({ fontFamily: e.target.value })}>
// //                 {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
// //               </select>
// //             </div>
// //             <div>
// //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille</p>
// //               <div className="flex items-center gap-1">
// //                 <input type="number" min={10} max={200}
// //                   className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none"
// //                   value={layer.fontSize} onChange={e => set({ fontSize: Number(e.target.value) })} />
// //                 <span className="text-[10px] text-slate-400">px</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Couleur & style */}
// //           <div className="flex items-center gap-3">
// //             <div className="flex items-center gap-1.5">
// //               <input type="color" value={layer.color} onChange={e => set({ color: e.target.value })}
// //                 className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
// //               <span className="text-[10px] text-slate-500 font-mono">{layer.color}</span>
// //             </div>
// //             <div className="flex gap-1 ml-auto">
// //               <button onClick={() => set({ bold: !layer.bold })}
// //                 className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${layer.bold ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// //                 <Bold className="w-3 h-3" />
// //               </button>
// //               <button onClick={() => set({ italic: !layer.italic })}
// //                 className={`w-7 h-7 rounded-lg text-xs italic flex items-center justify-center transition-all ${layer.italic ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// //                 <Italic className="w-3 h-3" />
// //               </button>
// //               {(["left", "center", "right"] as TextAlign[]).map(a => (
// //                 <button key={a} onClick={() => set({ align: a })}
// //                   className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${layer.align === a ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
// //                   {a === "left" ? <AlignLeft className="w-3 h-3" /> : a === "center" ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
// //                 </button>
// //               ))}
// //             </div>
// //           </div>

// //           {/* Position */}
// //           <div className="grid grid-cols-2 gap-2">
// //             <div>
// //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position X (%)</p>
// //               <input type="range" min={0} max={100} value={layer.x} onChange={e => set({ x: Number(e.target.value) })}
// //                 className="w-full accent-blue-500" />
// //               <span className="text-[10px] text-slate-500 font-mono">{layer.x}%</span>
// //             </div>
// //             <div>
// //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position Y (%)</p>
// //               <input type="range" min={0} max={100} value={layer.y} onChange={e => set({ y: Number(e.target.value) })}
// //                 className="w-full accent-blue-500" />
// //               <span className="text-[10px] text-slate-500 font-mono">{layer.y}%</span>
// //             </div>
// //           </div>

// //           {/* Rotation & Opacité */}
// //           <div className="grid grid-cols-2 gap-2">
// //             <div>
// //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rotation</p>
// //               <div className="flex items-center gap-1">
// //                 <input type="range" min={-180} max={180} value={layer.rotation} onChange={e => set({ rotation: Number(e.target.value) })}
// //                   className="flex-1 accent-blue-500" />
// //                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{layer.rotation}°</span>
// //               </div>
// //             </div>
// //             <div>
// //               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
// //               <div className="flex items-center gap-1">
// //                 <input type="range" min={0} max={1} step={0.05} value={layer.opacity} onChange={e => set({ opacity: Number(e.target.value) })}
// //                   className="flex-1 accent-blue-500" />
// //                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Fond du texte */}
// //           <div>
// //             <div className="flex items-center justify-between mb-1.5">
// //               <p className="text-[9px] font-black text-slate-400 uppercase">Fond du texte</p>
// //               <button
// //                 onClick={() => set({ backgroundColor: layer.backgroundColor ? undefined : "rgba(0,0,0,0.5)" })}
// //                 className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${layer.backgroundColor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
// //                 {layer.backgroundColor ? "Activé" : "Désactivé"}
// //               </button>
// //             </div>
// //             {layer.backgroundColor && (
// //               <div className="flex items-center gap-2">
// //                 <input type="color" value={layer.backgroundColor.startsWith("rgba") ? "#000000" : layer.backgroundColor}
// //                   onChange={e => set({ backgroundColor: e.target.value + "99" })}
// //                   className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
// //                 <input type="range" min={0} max={20} value={layer.backgroundPadding ?? 8}
// //                   onChange={e => set({ backgroundPadding: Number(e.target.value) })}
// //                   className="flex-1 accent-blue-500" />
// //                 <span className="text-[10px] text-slate-400">padding</span>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // ─── Page Résultats + Éditeur ─────────────────────────────────────────────────

// // const ResultsPage: React.FC = () => {
// //   const location = useLocation();
// //   const navigate = useNavigate();
// //   const { exportPoster } = usePosterExport();

// //   const poster: PosterData | undefined = location.state?.poster;
// //   const analysis = location.state?.analysis;

// //   const [editorState, setEditorState] = useState<PostEditorState>(DEFAULT_POST_EDITOR);
// //   const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
// //   const [activePanel, setActivePanel] = useState<"layers" | "adjust" | "logo">("layers");
// //   const [exporting, setExporting] = useState(false);
// //   const [exported, setExported] = useState(false);
// //   const [currentFormat, setCurrentFormat] = useState<string>(poster?.format ?? "1:1");

// //   const logoInputRef = useRef<HTMLInputElement>(null);
// //   const previewRef = useRef<HTMLDivElement>(null);

// //   // ── Recalculer les positions texte quand le format change ───────────────────
// //   const handleFormatChange = useCallback((newFormat: string) => {
// //     setCurrentFormat(newFormat);
// //     const layout = getSmartLayout(newFormat);
// //     setEditorState(prev => ({
// //       ...prev,
// //       textLayers: prev.textLayers.map(layer => {
// //         const pos = layout[layer.type as keyof ReturnType<typeof getSmartLayout>];
// //         if (!pos) return layer; // type "custom" → position non touchée
// //         return { ...layer, x: pos.x, y: pos.y, fontSize: pos.fontSize };
// //       }),
// //     }));
// //   }, []);

// //   // ── Initialiser les couches texte avec placement intelligent ────────────────
// //   useEffect(() => {
// //     if (!poster || !analysis) return;

// //     // Récupérer le layout intelligent selon le format initial
// //     const layout = getSmartLayout(poster.format);

// //     const layers: TextLayer[] = [];

// //     // Slogan — zone haute, centré, très visible
// //     if (analysis.slogan) {
// //       layers.push({
// //         id: generateId(),
// //         type: "slogan",
// //         content: analysis.slogan,
// //         x: layout.slogan.x,
// //         y: layout.slogan.y,
// //         fontSize: layout.slogan.fontSize,
// //         fontFamily: "Impact",
// //         color: "#FFFFFF",
// //         bold: true,
// //         italic: false,
// //         align: "center",
// //         rotation: 0,
// //         opacity: 1,
// //         backgroundColor: "rgba(0,0,0,0.45)",
// //         backgroundPadding: 14,
// //         backgroundRadius: 10,
// //       });
// //     }

// //     // Prix — zone basse-droite, badge doré bien visible
// //     if (analysis.generatedPrice) {
// //       layers.push({
// //         id: generateId(),
// //         type: "price",
// //         content: analysis.generatedPrice,
// //         x: layout.price.x,
// //         y: layout.price.y,
// //         fontSize: layout.price.fontSize,
// //         fontFamily: "Arial",
// //         color: "#FFD700",
// //         bold: true,
// //         italic: false,
// //         align: "center",
// //         rotation: 0,
// //         opacity: 1,
// //         backgroundColor: "rgba(0,0,0,0.65)",
// //         backgroundPadding: 12,
// //         backgroundRadius: 50,
// //       });
// //     }

// //     // Promo — zone milieu, légèrement incliné pour dynamisme
// //     if (analysis.generatedPromo) {
// //       layers.push({
// //         id: generateId(),
// //         type: "promo",
// //         content: analysis.generatedPromo,
// //         x: layout.promo.x,
// //         y: layout.promo.y,
// //         fontSize: layout.promo.fontSize,
// //         fontFamily: "Arial",
// //         color: "#FF4444",
// //         bold: true,
// //         italic: false,
// //         align: "center",
// //         rotation: -4,
// //         opacity: 1,
// //         backgroundColor: "#FFFFFF",
// //         backgroundPadding: 11,
// //         backgroundRadius: 6,
// //       });
// //     }

// //     // CTA — zone basse, centré, bouton arrondi bleu
// //     if (analysis.generatedCta) {
// //       layers.push({
// //         id: generateId(),
// //         type: "cta",
// //         content: analysis.generatedCta,
// //         x: layout.cta.x,
// //         y: layout.cta.y,
// //         fontSize: layout.cta.fontSize,
// //         fontFamily: "Arial",
// //         color: "#FFFFFF",
// //         bold: true,
// //         italic: false,
// //         align: "center",
// //         rotation: 0,
// //         opacity: 1,
// //         backgroundColor: "#2563EB",
// //         backgroundPadding: 15,
// //         backgroundRadius: 50,
// //       });
// //     }

// //     setEditorState(prev => ({ ...prev, textLayers: layers }));
// //   }, [poster, analysis]);

// //   if (!poster) {
// //     return (
// //       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
// //         <p className="text-slate-500">Aucun poster à afficher.</p>
// //         <button onClick={() => navigate("/")} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">
// //           Retour au générateur
// //         </button>
// //       </div>
// //     );
// //   }

// //   // Dimensions affiche selon format
// //   const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
// //     "1:1":  { w: 512, h: 512 },
// //     "9:16": { w: 360, h: 640 },
// //     "16:9": { w: 640, h: 360 },
// //     "4:3":  { w: 512, h: 384 },
// //     "3:4":  { w: 384, h: 512 },
// //   };
// //   const dims = FORMAT_DIMS[currentFormat] ?? { w: 512, h: 512 };

// //   const { textLayers, logoLayer, adjustments } = editorState;

// //   const setAdj = (key: keyof ImageAdjustments, value: number) =>
// //     setEditorState(prev => ({ ...prev, adjustments: { ...prev.adjustments, [key]: value } }));

// //   const addTextLayer = () => {
// //     const layer: TextLayer = {
// //       id: generateId(),
// //       type: "custom",
// //       content: "Nouveau texte",
// //       x: 50, y: 50,
// //       fontSize: 32,
// //       fontFamily: "Arial",
// //       color: "#FFFFFF",
// //       bold: false,
// //       italic: false,
// //       align: "center",
// //       rotation: 0,
// //       opacity: 1,
// //     };
// //     setEditorState(prev => ({ ...prev, textLayers: [...prev.textLayers, layer] }));
// //     setSelectedLayerId(layer.id);
// //   };

// //   const updateLayer = (id: string, updated: TextLayer) =>
// //     setEditorState(prev => ({
// //       ...prev,
// //       textLayers: prev.textLayers.map(l => l.id === id ? updated : l),
// //     }));

// //   const deleteLayer = (id: string) =>
// //     setEditorState(prev => ({
// //       ...prev,
// //       textLayers: prev.textLayers.filter(l => l.id !== id),
// //     }));

// //   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (!file) return;
// //     const reader = new FileReader();
// //     reader.onloadend = () => {
// //       const logo: LogoLayer = {
// //         id: generateId(),
// //         src: reader.result as string,
// //         x: 5, y: 5,
// //         width: 20,
// //         opacity: 1,
// //       };
// //       setEditorState(prev => ({ ...prev, logoLayer: logo }));
// //     };
// //     reader.readAsDataURL(file);
// //     if (logoInputRef.current) logoInputRef.current.value = "";
// //   };

// //   const handleExport = async () => {
// //     setExporting(true);
// //     try {
// //       const exportW = 1024;
// //       const exportH = Math.round(exportW * (dims.h / dims.w));
// //       const dataUrl = await exportPoster(
// //         poster.imageUrl, textLayers, logoLayer, adjustments, exportW, exportH, dims.w
// //       );
// //       const a = document.createElement("a");
// //       a.href = dataUrl;
// //       a.download = `affiche-${poster.id}.png`;
// //       a.click();
// //       setExported(true);
// //       setTimeout(() => setExported(false), 3000);
// //     } catch (err) {
// //       console.error("Export:", err);
// //       alert("Erreur lors de l'export.");
// //     } finally {
// //       setExporting(false);
// //     }
// //   };

// //   // Filtre CSS pour la prévisualisation
// //   const previewFilter = [
// //     adjustments.brightness !== 0 ? `brightness(${1 + adjustments.brightness / 100})` : "",
// //     adjustments.contrast !== 0 ? `contrast(${1 + adjustments.contrast / 100})` : "",
// //     adjustments.saturation !== 0 ? `saturate(${1 + adjustments.saturation / 100})` : "",
// //     adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
// //   ].filter(Boolean).join(" ") || "none";

// //   const hasProductImage = poster.customization.userImages.some(i => i.role === "product");

// //   // ── FIX 2 : Échelle de police adaptée à la taille de prévisualisation ────────
// //   // Base de référence : 512px de largeur
// //   const fontScale = dims.w / 512;

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 py-8">

// //       {/* Header */}
// //       <div className="flex items-center justify-between mb-6">
// //         <div className="flex items-center gap-3">
// //           <button onClick={() => navigate(-1)}
// //             className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
// //             <ArrowLeft className="w-4 h-4 text-slate-600" />
// //           </button>
// //           <div>
// //             <h1 className="text-2xl font-black text-slate-900">Éditeur Post-Génération</h1>
// //             <p className="text-xs text-slate-500 mt-0.5">
// //               {hasProductImage
// //                 ? "Mode 1 · Image fournie comme fond · Éditez les textes superposés"
// //                 : "Mode 2 · Image générée · Éditez les textes et ajustements"}
// //             </p>
// //           </div>
// //         </div>
// //         <button
// //           onClick={handleExport}
// //           disabled={exporting}
// //           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${
// //             exported
// //               ? "bg-emerald-500 text-white"
// //               : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
// //           }`}
// //         >
// //           {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
// //           {exporting ? "Export..." : exported ? "Téléchargé !" : "Exporter HD"}
// //         </button>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

// //         {/* ════ PRÉVISUALISATION ════ */}
// //         <div className="lg:col-span-6 flex flex-col items-center">

// //           {/* Sélecteur de format en post-édition */}
// //           <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
// //             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Format :</span>
// //             {(["1:1","9:16","16:9","4:3","3:4"] as const).map(f => (
// //               <button
// //                 key={f}
// //                 onClick={() => handleFormatChange(f)}
// //                 className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
// //                   currentFormat === f
// //                     ? "bg-blue-600 text-white border-transparent shadow"
// //                     : "border-slate-200 text-slate-500 hover:border-slate-400"
// //                 }`}
// //               >
// //                 {f}
// //               </button>
// //             ))}
// //           </div>

// //           <div
// //             ref={previewRef}
// //             className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-200"
// //             style={{
// //               width: dims.w,
// //               height: dims.h,
// //               maxWidth: "100%",
// //             }}
// //           >
// //             {/* Image couvre tout le format sans espaces noirs */}
// //             <img
// //               src={poster.imageUrl}
// //               alt="Affiche"
// //               className="absolute inset-0 w-full h-full"
// //               style={{
// //                 objectFit: "cover",
// //                 objectPosition: "center center",
// //                 filter: previewFilter,
// //               }}
// //               draggable={false}
// //             />

// //             {/* Logo */}
// //             {logoLayer && (
// //               <div
// //                 className="absolute cursor-move select-none"
// //                 style={{
// //                   left: `${logoLayer.x}%`,
// //                   top: `${logoLayer.y}%`,
// //                   width: `${logoLayer.width}%`,
// //                   opacity: logoLayer.opacity,
// //                 }}
// //               >
// //                 <img src={logoLayer.src} alt="Logo" className="w-full" draggable={false} />
// //               </div>
// //             )}

// //             {/* ── FIX 2 : Couches texte avec fontSize scalée au format ── */}
// //             {textLayers.map(layer => (
// //               <div
// //                 key={layer.id}
// //                 onClick={() => setSelectedLayerId(layer.id)}
// //                 className={`absolute select-none transition-all ${selectedLayerId === layer.id ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
// //                 style={{
// //                   left: `${layer.x}%`,
// //                   top: `${layer.y}%`,
// //                   transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
// //                   opacity: layer.opacity,
// //                   cursor: "pointer",
// //                   fontFamily: layer.fontFamily,
// //                   // ── FIX 2 : fontSize scalée proportionnellement au format ──
// //                   fontSize: `${layer.fontSize * fontScale}px`,
// //                   color: layer.color,
// //                   fontWeight: layer.bold ? "bold" : "normal",
// //                   fontStyle: layer.italic ? "italic" : "normal",
// //                   textAlign: layer.align,
// //                   whiteSpace: "nowrap",
// //                   textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
// //                   backgroundColor: layer.backgroundColor,
// //                   padding: layer.backgroundColor
// //                     ? `${(layer.backgroundPadding ?? 8) * fontScale}px ${(layer.backgroundPadding ?? 8) * 1.5 * fontScale}px`
// //                     : undefined,
// //                   borderRadius: layer.backgroundColor ? `${layer.backgroundRadius ?? 6}px` : undefined,
// //                 }}
// //               >
// //                 {layer.content}
// //               </div>
// //             ))}
// //           </div>

// //           {/* Info mode */}
// //           <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
// //             hasProductImage
// //               ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
// //               : "bg-blue-50 text-blue-700 border border-blue-100"
// //           }`}>
// //             {hasProductImage ? <ImageIcon className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
// //             {hasProductImage
// //               ? "Image produit utilisée comme fond · Sans modification"
// //               : "Affiche générée par IA · Textes superposés"}
// //           </div>

// //           {/* Hashtags */}
// //           {analysis?.hashtags && analysis.hashtags.length > 0 && (
// //             <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
// //               {analysis.hashtags.map((tag: string) => (
// //                 <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium">
// //                   #{tag}
// //                 </span>
// //               ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* ════ PANNEAU ÉDITION ════ */}
// //         <div className="lg:col-span-6 space-y-4">

// //           {/* Onglets panneau */}
// //           <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
// //             {([
// //               { id: "layers", label: "Textes", icon: <Type className="w-4 h-4" /> },
// //               { id: "adjust", label: "Réglages", icon: <Sliders className="w-4 h-4" /> },
// //               { id: "logo",   label: "Logo",    icon: <ImageIcon className="w-4 h-4" /> },
// //             ] as { id: typeof activePanel; label: string; icon: React.ReactNode }[]).map(tab => (
// //               <button
// //                 key={tab.id}
// //                 onClick={() => setActivePanel(tab.id)}
// //                 className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
// //                   activePanel === tab.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
// //                 }`}
// //               >
// //                 {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
// //               </button>
// //             ))}
// //           </div>

// //           {/* ── Panel: TEXTES ── */}
// //           {activePanel === "layers" && (
// //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-3">
// //               <div className="flex items-center justify-between">
// //                 <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// //                   <Type className="w-4 h-4" /> Couches de texte
// //                 </h3>
// //                 <button
// //                   onClick={addTextLayer}
// //                   className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
// //                 >
// //                   <Plus className="w-3.5 h-3.5" /> Ajouter
// //                 </button>
// //               </div>

// //               {textLayers.length === 0 ? (
// //                 <div className="py-8 text-center">
// //                   <Type className="w-8 h-8 text-slate-200 mx-auto mb-3" />
// //                   <p className="text-sm text-slate-400 font-medium">Aucune couche texte</p>
// //                   <p className="text-xs text-slate-300 mt-1">Cliquez "Ajouter" pour créer un texte</p>
// //                 </div>
// //               ) : (
// //                 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
// //                   {textLayers.map(layer => (
// //                     <TextLayerCard
// //                       key={layer.id}
// //                       layer={layer}
// //                       selected={selectedLayerId === layer.id}
// //                       onSelect={() => setSelectedLayerId(layer.id)}
// //                       onChange={updated => updateLayer(layer.id, updated)}
// //                       onDelete={() => {
// //                         deleteLayer(layer.id);
// //                         if (selectedLayerId === layer.id) setSelectedLayerId(null);
// //                       }}
// //                     />
// //                   ))}
// //                 </div>
// //               )}

// //               <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
// //                 Cliquez sur un texte dans la prévisualisation pour le sélectionner
// //               </p>
// //             </div>
// //           )}

// //           {/* ── Panel: RÉGLAGES IMAGE ── */}
// //           {activePanel === "adjust" && (
// //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-5">
// //               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// //                 <Sliders className="w-4 h-4" /> Réglages de l'image
// //               </h3>

// //               {[
// //                 { key: "brightness" as const, label: "Luminosité", icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
// //                 { key: "contrast"   as const, label: "Contraste",  icon: <Contrast className="w-4 h-4" />, min: -100, max: 100 },
// //                 { key: "saturation" as const, label: "Saturation", icon: <Droplets className="w-4 h-4" />, min: -100, max: 100 },
// //                 { key: "blur"       as const, label: "Flou",       icon: <Wind className="w-4 h-4" />, min: 0, max: 20 },
// //               ].map(({ key, label, icon, min, max }) => (
// //                 <div key={key}>
// //                   <div className="flex items-center justify-between mb-2">
// //                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
// //                       <span className="text-slate-400">{icon}</span>
// //                       {label}
// //                     </div>
// //                     <div className="flex items-center gap-2">
// //                       <span className="text-xs font-mono text-slate-500 w-10 text-right">{adjustments[key]}</span>
// //                       <button
// //                         onClick={() => setAdj(key, 0)}
// //                         className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
// //                       >
// //                         Reset
// //                       </button>
// //                     </div>
// //                   </div>
// //                   <input
// //                     type="range" min={min} max={max} value={adjustments[key]}
// //                     onChange={e => setAdj(key, Number(e.target.value))}
// //                     className="w-full accent-blue-500"
// //                   />
// //                   <div className="flex justify-between mt-0.5">
// //                     <span className="text-[9px] text-slate-300">{min}</span>
// //                     <span className="text-[9px] text-slate-300">{max}</span>
// //                   </div>
// //                 </div>
// //               ))}

// //               <button
// //                 onClick={() => setEditorState(prev => ({ ...prev, adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 } }))}
// //                 className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-2"
// //               >
// //                 <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser tous les réglages
// //               </button>
// //             </div>
// //           )}

// //           {/* ── Panel: LOGO ── */}
// //           {activePanel === "logo" && (
// //             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-4">
// //               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
// //                 <ImageIcon className="w-4 h-4" /> Logo de marque
// //               </h3>

// //               {!logoLayer ? (
// //                 <button
// //                   onClick={() => logoInputRef.current?.click()}
// //                   className="w-full py-10 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl transition-all flex flex-col items-center gap-3 group"
// //                 >
// //                   <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
// //                     <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
// //                   </div>
// //                   <div className="text-center">
// //                     <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Ajouter votre logo</p>
// //                     <p className="text-[10px] text-slate-400 mt-0.5">PNG avec transparence recommandé</p>
// //                   </div>
// //                 </button>
// //               ) : (
// //                 <div className="space-y-4">
// //                   {/* Aperçu */}
// //                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
// //                     <img src={logoLayer.src} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-100" />
// //                     <div className="flex-1">
// //                       <p className="text-xs font-black text-slate-700">Logo chargé</p>
// //                       <p className="text-[10px] text-slate-400">Ajustez la position et la taille ci-dessous</p>
// //                     </div>
// //                     <button onClick={() => setEditorState(prev => ({ ...prev, logoLayer: null }))}
// //                       className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center">
// //                       <X className="w-3.5 h-3.5" />
// //                     </button>
// //                   </div>

// //                   {/* Position X/Y */}
// //                   <div className="grid grid-cols-2 gap-3">
// //                     {([
// //                       { key: "x" as const, label: "Position X (%)" },
// //                       { key: "y" as const, label: "Position Y (%)" },
// //                     ]).map(({ key, label }) => (
// //                       <div key={key}>
// //                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
// //                         <input type="range" min={0} max={90} value={logoLayer[key]}
// //                           onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, [key]: Number(e.target.value) } : null }))}
// //                           className="w-full accent-blue-500" />
// //                         <span className="text-[10px] font-mono text-slate-500">{logoLayer[key]}%</span>
// //                       </div>
// //                     ))}
// //                   </div>

// //                   {/* Taille & Opacité */}
// //                   <div className="grid grid-cols-2 gap-3">
// //                     <div>
// //                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille (%)</p>
// //                       <input type="range" min={5} max={50} value={logoLayer.width}
// //                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, width: Number(e.target.value) } : null }))}
// //                         className="w-full accent-blue-500" />
// //                       <span className="text-[10px] font-mono text-slate-500">{logoLayer.width}%</span>
// //                     </div>
// //                     <div>
// //                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
// //                       <input type="range" min={0.1} max={1} step={0.05} value={logoLayer.opacity}
// //                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, opacity: Number(e.target.value) } : null }))}
// //                         className="w-full accent-blue-500" />
// //                       <span className="text-[10px] font-mono text-slate-500">{Math.round(logoLayer.opacity * 100)}%</span>
// //                     </div>
// //                   </div>

// //                   <button onClick={() => logoInputRef.current?.click()}
// //                     className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
// //                     Changer le logo
// //                   </button>
// //                 </div>
// //               )}
// //             </div>
// //           )}

// //           {/* Copier le texte marketing */}
// //           {analysis?.marketingCopy && (
// //             <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
// //               <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Texte marketing généré</p>
// //               <p className="text-sm text-slate-700 leading-relaxed">{analysis.marketingCopy}</p>
// //               <button
// //                 onClick={() => navigator.clipboard.writeText(analysis.marketingCopy)}
// //                 className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
// //               >
// //                 <Copy className="w-3 h-3" /> Copier
// //               </button>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
// //     </div>
// //   );
// // };

// // export default ResultsPage;


// import React, { useState, useRef, useCallback, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   Download, ArrowLeft, Plus, Trash2, Move, Type,
//   Sun, Contrast, Droplets, Wind, Image as ImageIcon,
//   Bold, Italic, AlignLeft, AlignCenter, AlignRight,
//   RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp,
//   Layers, Palette, Sliders, Check, X, Copy,
// } from "lucide-react";
// import {
//   PosterData, TextLayer, LogoLayer, ImageAdjustments,
//   PostEditorState, DEFAULT_POST_EDITOR, TextAlign,
// } from "../types";

// // ─── Polices disponibles ──────────────────────────────────────────────────────

// const FONTS = [
//   "Arial", "Georgia", "Impact", "Helvetica",
//   "Times New Roman", "Verdana", "Trebuchet MS",
//   "Courier New", "Palatino", "Tahoma",
// ];

// function generateId() { return Math.random().toString(36).substr(2, 9); }

// // ─── Hook canvas export ───────────────────────────────────────────────────────

// function usePosterExport() {
//   const exportPoster = useCallback(async (
//     imageUrl: string,
//     textLayers: TextLayer[],
//     logoLayer: LogoLayer | null,
//     adjustments: ImageAdjustments,
//     width: number,
//     height: number
//   ): Promise<string> => {
//     const canvas = document.createElement("canvas");
//     canvas.width = width;
//     canvas.height = height;
//     const ctx = canvas.getContext("2d")!;

//     // Charger image de fond
//     await new Promise<void>((resolve, reject) => {
//       const img = new Image();
//       img.crossOrigin = "anonymous";
//       img.onload = () => {
//         ctx.filter = [
//           `brightness(${1 + adjustments.brightness / 100})`,
//           `contrast(${1 + adjustments.contrast / 100})`,
//           `saturate(${1 + adjustments.saturation / 100})`,
//           adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
//         ].filter(Boolean).join(" ");

//         // object-cover : l'image remplit tout le canvas sans espaces, recadrage centré
//         const imgAspect = img.naturalWidth / img.naturalHeight;
//         const canvasAspect = width / height;
//         let sx: number, sy: number, sw: number, sh: number;
//         if (imgAspect > canvasAspect) {
//           // Image plus large que le canvas : crop horizontal centré
//           sh = img.naturalHeight;
//           sw = img.naturalHeight * canvasAspect;
//           sx = (img.naturalWidth - sw) / 2;
//           sy = 0;
//         } else {
//           // Image plus haute que le canvas : crop vertical centré
//           sw = img.naturalWidth;
//           sh = img.naturalWidth / canvasAspect;
//           sx = 0;
//           sy = (img.naturalHeight - sh) / 2;
//         }
//         ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
//         ctx.filter = "none";
//         resolve();
//       };
//       img.onerror = reject;
//       img.src = imageUrl;
//     });

//     // Dessiner logo
//     if (logoLayer) {
//       await new Promise<void>((resolve) => {
//         const img = new Image();
//         img.crossOrigin = "anonymous";
//         img.onload = () => {
//           const logoW = (logoLayer.width / 100) * width;
//           const logoH = (logoW / img.naturalWidth) * img.naturalHeight;
//           ctx.globalAlpha = logoLayer.opacity;
//           ctx.drawImage(img, (logoLayer.x / 100) * width, (logoLayer.y / 100) * height, logoW, logoH);
//           ctx.globalAlpha = 1;
//           resolve();
//         };
//         img.onerror = () => resolve();
//         img.src = logoLayer.src;
//       });
//     }

//     // Dessiner textes
//     for (const layer of textLayers) {
//       if (!layer.content) continue;
//       ctx.save();
//       const x = (layer.x / 100) * width;
//       const y = (layer.y / 100) * height;
//       ctx.translate(x, y);
//       ctx.rotate((layer.rotation * Math.PI) / 180);
//       ctx.globalAlpha = layer.opacity;

//       // fontSize stockée en base 512px → scaler au canvas export (même logique que preview CSS)
//       const exportFontSize = layer.fontSize * (width / 512);
//       const fontStr = `${layer.italic ? "italic " : ""}${layer.bold ? "bold " : ""}${exportFontSize}px "${layer.fontFamily}"`;
//       ctx.font = fontStr;
//       ctx.textAlign = layer.align as CanvasTextAlign;
//       ctx.textBaseline = "middle";

//       // Background du texte
//       if (layer.backgroundColor) {
//         const metrics = ctx.measureText(layer.content);
//         const pad = (layer.backgroundPadding ?? 8) * (width / 512);
//         const bw = metrics.width + pad * 2;
//         const bh = exportFontSize + pad * 2;
//         const bx = layer.align === "center" ? -bw / 2 : layer.align === "right" ? -bw : 0;
//         ctx.fillStyle = layer.backgroundColor;
//         const r = layer.backgroundRadius ?? 6;
//         ctx.beginPath();
//         ctx.roundRect(bx - pad, -bh / 2, bw, bh, r);
//         ctx.fill();
//       }

//       // Ombre portée légère
//       ctx.shadowColor = "rgba(0,0,0,0.5)";
//       ctx.shadowBlur = 4;
//       ctx.shadowOffsetX = 1;
//       ctx.shadowOffsetY = 1;
//       ctx.fillStyle = layer.color;
//       ctx.fillText(layer.content, 0, 0);
//       ctx.restore();
//     }

//     return canvas.toDataURL("image/png");
//   }, []);

//   return { exportPoster };
// }

// // ─── FIX 2 : Placement intelligent des éléments selon le format ──────────────

// /**
//  * Calcule les positions et tailles optimales des couches texte
//  * selon le format de l'affiche (portrait, paysage, carré).
//  * Zones : slogan=haut-centre, prix=haut-droite, promo=milieu, cta=bas-centre
//  */
// function getSmartLayout(format: string): {
//   slogan:  { x: number; y: number; fontSize: number };
//   price:   { x: number; y: number; fontSize: number };
//   promo:   { x: number; y: number; fontSize: number };
//   cta:     { x: number; y: number; fontSize: number };
// } {
//   // Portrait 9:16 (stories, téléphone)
//   if (format === "9:16") {
//     return {
//       slogan: { x: 50, y: 12,  fontSize: 36 },
//       price:  { x: 82, y: 82,  fontSize: 32 },
//       promo:  { x: 50, y: 35,  fontSize: 26 },
//       cta:    { x: 50, y: 91,  fontSize: 20 },
//     };
//   }
//   // Paysage 16:9 (bannière, desktop)
//   if (format === "16:9") {
//     return {
//       slogan: { x: 50, y: 14,  fontSize: 34 },
//       price:  { x: 88, y: 75,  fontSize: 30 },
//       promo:  { x: 30, y: 55,  fontSize: 24 },
//       cta:    { x: 50, y: 88,  fontSize: 19 },
//     };
//   }
//   // Portrait doux 3:4
//   if (format === "3:4") {
//     return {
//       slogan: { x: 50, y: 13,  fontSize: 38 },
//       price:  { x: 82, y: 80,  fontSize: 34 },
//       promo:  { x: 50, y: 38,  fontSize: 27 },
//       cta:    { x: 50, y: 90,  fontSize: 21 },
//     };
//   }
//   // Paysage doux 4:3
//   if (format === "4:3") {
//     return {
//       slogan: { x: 50, y: 13,  fontSize: 36 },
//       price:  { x: 85, y: 78,  fontSize: 32 },
//       promo:  { x: 35, y: 52,  fontSize: 25 },
//       cta:    { x: 50, y: 89,  fontSize: 20 },
//     };
//   }
//   // Carré 1:1 (par défaut)
//   return {
//     slogan: { x: 50, y: 13,  fontSize: 40 },
//     price:  { x: 83, y: 80,  fontSize: 34 },
//     promo:  { x: 50, y: 38,  fontSize: 28 },
//     cta:    { x: 50, y: 90,  fontSize: 22 },
//   };
// }

// // ─── TextLayerCard ────────────────────────────────────────────────────────────

// const TextLayerCard: React.FC<{
//   layer: TextLayer;
//   selected: boolean;
//   onSelect: () => void;
//   onChange: (l: TextLayer) => void;
//   onDelete: () => void;
// }> = ({ layer, selected, onSelect, onChange, onDelete }) => {
//   const [expanded, setExpanded] = useState(selected);
//   useEffect(() => { if (selected) setExpanded(true); }, [selected]);

//   const set = (updates: Partial<TextLayer>) => onChange({ ...layer, ...updates });

//   const typeLabel: Record<TextLayer["type"], string> = {
//     slogan: "Slogan", price: "Prix", promo: "Promo", cta: "CTA", custom: "Texte libre",
//   };
//   const typeColor: Record<TextLayer["type"], string> = {
//     slogan: "bg-violet-100 text-violet-700",
//     price:  "bg-emerald-100 text-emerald-700",
//     promo:  "bg-orange-100 text-orange-700",
//     cta:    "bg-blue-100 text-blue-700",
//     custom: "bg-slate-100 text-slate-700",
//   };

//   return (
//     <div
//       className={`rounded-2xl border transition-all ${selected ? "border-blue-400 shadow-md shadow-blue-100" : "border-slate-200"}`}
//       onClick={onSelect}
//     >
//       {/* Header */}
//       <div className="flex items-center gap-2 p-3">
//         <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeColor[layer.type]}`}>
//           {typeLabel[layer.type]}
//         </span>
//         <span className="flex-1 text-xs font-medium text-slate-700 truncate">
//           {layer.content || <span className="text-slate-400 italic">Vide</span>}
//         </span>
//         <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} className="text-slate-400 hover:text-slate-600">
//           {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
//         </button>
//         <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600">
//           <Trash2 className="w-3.5 h-3.5" />
//         </button>
//       </div>

//       {/* Corps éditable */}
//       {expanded && (
//         <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3" onClick={e => e.stopPropagation()}>
//           {/* Contenu */}
//           <input
//             className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
//             placeholder="Contenu du texte..."
//             value={layer.content}
//             onChange={e => set({ content: e.target.value })}
//           />

//           {/* Police & taille */}
//           <div className="grid grid-cols-2 gap-2">
//             <div>
//               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Police</p>
//               <select className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none"
//                 value={layer.fontFamily} onChange={e => set({ fontFamily: e.target.value })}>
//                 {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
//               </select>
//             </div>
//             <div>
//               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille</p>
//               <div className="flex items-center gap-1">
//                 <input type="number" min={10} max={200}
//                   className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none"
//                   value={layer.fontSize} onChange={e => set({ fontSize: Number(e.target.value) })} />
//                 <span className="text-[10px] text-slate-400">px</span>
//               </div>
//             </div>
//           </div>

//           {/* Couleur & style */}
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-1.5">
//               <input type="color" value={layer.color} onChange={e => set({ color: e.target.value })}
//                 className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
//               <span className="text-[10px] text-slate-500 font-mono">{layer.color}</span>
//             </div>
//             <div className="flex gap-1 ml-auto">
//               <button onClick={() => set({ bold: !layer.bold })}
//                 className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${layer.bold ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
//                 <Bold className="w-3 h-3" />
//               </button>
//               <button onClick={() => set({ italic: !layer.italic })}
//                 className={`w-7 h-7 rounded-lg text-xs italic flex items-center justify-center transition-all ${layer.italic ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
//                 <Italic className="w-3 h-3" />
//               </button>
//               {(["left", "center", "right"] as TextAlign[]).map(a => (
//                 <button key={a} onClick={() => set({ align: a })}
//                   className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${layer.align === a ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
//                   {a === "left" ? <AlignLeft className="w-3 h-3" /> : a === "center" ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Position */}
//           <div className="grid grid-cols-2 gap-2">
//             <div>
//               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position X (%)</p>
//               <input type="range" min={0} max={100} value={layer.x} onChange={e => set({ x: Number(e.target.value) })}
//                 className="w-full accent-blue-500" />
//               <span className="text-[10px] text-slate-500 font-mono">{layer.x}%</span>
//             </div>
//             <div>
//               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position Y (%)</p>
//               <input type="range" min={0} max={100} value={layer.y} onChange={e => set({ y: Number(e.target.value) })}
//                 className="w-full accent-blue-500" />
//               <span className="text-[10px] text-slate-500 font-mono">{layer.y}%</span>
//             </div>
//           </div>

//           {/* Rotation & Opacité */}
//           <div className="grid grid-cols-2 gap-2">
//             <div>
//               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rotation</p>
//               <div className="flex items-center gap-1">
//                 <input type="range" min={-180} max={180} value={layer.rotation} onChange={e => set({ rotation: Number(e.target.value) })}
//                   className="flex-1 accent-blue-500" />
//                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{layer.rotation}°</span>
//               </div>
//             </div>
//             <div>
//               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
//               <div className="flex items-center gap-1">
//                 <input type="range" min={0} max={1} step={0.05} value={layer.opacity} onChange={e => set({ opacity: Number(e.target.value) })}
//                   className="flex-1 accent-blue-500" />
//                 <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
//               </div>
//             </div>
//           </div>

//           {/* Fond du texte */}
//           <div>
//             <div className="flex items-center justify-between mb-1.5">
//               <p className="text-[9px] font-black text-slate-400 uppercase">Fond du texte</p>
//               <button
//                 onClick={() => set({ backgroundColor: layer.backgroundColor ? undefined : "rgba(0,0,0,0.5)" })}
//                 className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${layer.backgroundColor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
//                 {layer.backgroundColor ? "Activé" : "Désactivé"}
//               </button>
//             </div>
//             {layer.backgroundColor && (
//               <div className="flex items-center gap-2">
//                 <input type="color" value={layer.backgroundColor.startsWith("rgba") ? "#000000" : layer.backgroundColor}
//                   onChange={e => set({ backgroundColor: e.target.value + "99" })}
//                   className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
//                 <input type="range" min={0} max={20} value={layer.backgroundPadding ?? 8}
//                   onChange={e => set({ backgroundPadding: Number(e.target.value) })}
//                   className="flex-1 accent-blue-500" />
//                 <span className="text-[10px] text-slate-400">padding</span>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // ─── Page Résultats + Éditeur ─────────────────────────────────────────────────

// const ResultsPage: React.FC = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { exportPoster } = usePosterExport();

//   const poster: PosterData | undefined = location.state?.poster;
//   const analysis = location.state?.analysis;

//   const [editorState, setEditorState] = useState<PostEditorState>(DEFAULT_POST_EDITOR);
//   const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
//   const [activePanel, setActivePanel] = useState<"layers" | "adjust" | "logo">("layers");
//   const [exporting, setExporting] = useState(false);
//   const [exported, setExported] = useState(false);
//   const [currentFormat, setCurrentFormat] = useState<string>(poster?.format ?? "1:1");

//   const logoInputRef = useRef<HTMLInputElement>(null);
//   const previewRef = useRef<HTMLDivElement>(null);

//   // ── Recalculer les positions texte quand le format change ───────────────────
//   const handleFormatChange = useCallback((newFormat: string) => {
//     setCurrentFormat(newFormat);
//     const layout = getSmartLayout(newFormat);
//     setEditorState(prev => ({
//       ...prev,
//       textLayers: prev.textLayers.map(layer => {
//         const pos = layout[layer.type as keyof ReturnType<typeof getSmartLayout>];
//         if (!pos) return layer; // type "custom" → position non touchée
//         return { ...layer, x: pos.x, y: pos.y, fontSize: pos.fontSize };
//       }),
//     }));
//   }, []);

//   // ── Initialiser les couches texte avec placement intelligent ────────────────
//   useEffect(() => {
//     if (!poster || !analysis) return;

//     // Récupérer le layout intelligent selon le format initial
//     const layout = getSmartLayout(poster.format);

//     const layers: TextLayer[] = [];

//     // Slogan — zone haute, centré, très visible
//     if (analysis.slogan) {
//       layers.push({
//         id: generateId(),
//         type: "slogan",
//         content: analysis.slogan,
//         x: layout.slogan.x,
//         y: layout.slogan.y,
//         fontSize: layout.slogan.fontSize,
//         fontFamily: "Impact",
//         color: "#FFFFFF",
//         bold: true,
//         italic: false,
//         align: "center",
//         rotation: 0,
//         opacity: 1,
//         backgroundColor: "rgba(0,0,0,0.45)",
//         backgroundPadding: 14,
//         backgroundRadius: 10,
//       });
//     }

//     // Prix — zone basse-droite, badge doré bien visible
//     if (analysis.generatedPrice) {
//       layers.push({
//         id: generateId(),
//         type: "price",
//         content: analysis.generatedPrice,
//         x: layout.price.x,
//         y: layout.price.y,
//         fontSize: layout.price.fontSize,
//         fontFamily: "Arial",
//         color: "#FFD700",
//         bold: true,
//         italic: false,
//         align: "center",
//         rotation: 0,
//         opacity: 1,
//         backgroundColor: "rgba(0,0,0,0.65)",
//         backgroundPadding: 12,
//         backgroundRadius: 50,
//       });
//     }

//     // Promo — zone milieu, légèrement incliné pour dynamisme
//     if (analysis.generatedPromo) {
//       layers.push({
//         id: generateId(),
//         type: "promo",
//         content: analysis.generatedPromo,
//         x: layout.promo.x,
//         y: layout.promo.y,
//         fontSize: layout.promo.fontSize,
//         fontFamily: "Arial",
//         color: "#FF4444",
//         bold: true,
//         italic: false,
//         align: "center",
//         rotation: -4,
//         opacity: 1,
//         backgroundColor: "#FFFFFF",
//         backgroundPadding: 11,
//         backgroundRadius: 6,
//       });
//     }

//     // CTA — zone basse, centré, bouton arrondi bleu
//     if (analysis.generatedCta) {
//       layers.push({
//         id: generateId(),
//         type: "cta",
//         content: analysis.generatedCta,
//         x: layout.cta.x,
//         y: layout.cta.y,
//         fontSize: layout.cta.fontSize,
//         fontFamily: "Arial",
//         color: "#FFFFFF",
//         bold: true,
//         italic: false,
//         align: "center",
//         rotation: 0,
//         opacity: 1,
//         backgroundColor: "#2563EB",
//         backgroundPadding: 15,
//         backgroundRadius: 50,
//       });
//     }

//     setEditorState(prev => ({ ...prev, textLayers: layers }));
//   }, [poster, analysis]);

//   if (!poster) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
//         <p className="text-slate-500">Aucun poster à afficher.</p>
//         <button onClick={() => navigate("/")} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">
//           Retour au générateur
//         </button>
//       </div>
//     );
//   }

//   // Dimensions affiche selon format
//   const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
//     "1:1":  { w: 512, h: 512 },
//     "9:16": { w: 360, h: 640 },
//     "16:9": { w: 640, h: 360 },
//     "4:3":  { w: 512, h: 384 },
//     "3:4":  { w: 384, h: 512 },
//   };
//   const dims = FORMAT_DIMS[currentFormat] ?? { w: 512, h: 512 };

//   const { textLayers, logoLayer, adjustments } = editorState;

//   const setAdj = (key: keyof ImageAdjustments, value: number) =>
//     setEditorState(prev => ({ ...prev, adjustments: { ...prev.adjustments, [key]: value } }));

//   const addTextLayer = () => {
//     const layer: TextLayer = {
//       id: generateId(),
//       type: "custom",
//       content: "Nouveau texte",
//       x: 50, y: 50,
//       fontSize: 32,
//       fontFamily: "Arial",
//       color: "#FFFFFF",
//       bold: false,
//       italic: false,
//       align: "center",
//       rotation: 0,
//       opacity: 1,
//     };
//     setEditorState(prev => ({ ...prev, textLayers: [...prev.textLayers, layer] }));
//     setSelectedLayerId(layer.id);
//   };

//   const updateLayer = (id: string, updated: TextLayer) =>
//     setEditorState(prev => ({
//       ...prev,
//       textLayers: prev.textLayers.map(l => l.id === id ? updated : l),
//     }));

//   const deleteLayer = (id: string) =>
//     setEditorState(prev => ({
//       ...prev,
//       textLayers: prev.textLayers.filter(l => l.id !== id),
//     }));

//   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       const logo: LogoLayer = {
//         id: generateId(),
//         src: reader.result as string,
//         x: 5, y: 5,
//         width: 20,
//         opacity: 1,
//       };
//       setEditorState(prev => ({ ...prev, logoLayer: logo }));
//     };
//     reader.readAsDataURL(file);
//     if (logoInputRef.current) logoInputRef.current.value = "";
//   };

//   const handleExport = async () => {
//     setExporting(true);
//     try {
//       const exportW = 1024;
//       const exportH = Math.round(exportW * (dims.h / dims.w));
//       const dataUrl = await exportPoster(
//         poster.imageUrl, textLayers, logoLayer, adjustments, exportW, exportH
//       );
//       const a = document.createElement("a");
//       a.href = dataUrl;
//       a.download = `affiche-${poster.id}.png`;
//       a.click();
//       setExported(true);
//       setTimeout(() => setExported(false), 3000);
//     } catch (err) {
//       console.error("Export:", err);
//       alert("Erreur lors de l'export.");
//     } finally {
//       setExporting(false);
//     }
//   };

//   // Filtre CSS pour la prévisualisation
//   const previewFilter = [
//     adjustments.brightness !== 0 ? `brightness(${1 + adjustments.brightness / 100})` : "",
//     adjustments.contrast !== 0 ? `contrast(${1 + adjustments.contrast / 100})` : "",
//     adjustments.saturation !== 0 ? `saturate(${1 + adjustments.saturation / 100})` : "",
//     adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
//   ].filter(Boolean).join(" ") || "none";

//   const hasProductImage = poster.customization.userImages.some(i => i.role === "product");

//   // ── FIX 2 : Échelle de police adaptée à la taille de prévisualisation ────────
//   // Base de référence : 512px de largeur
//   const fontScale = dims.w / 512;

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">

//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <button onClick={() => navigate(-1)}
//             className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
//             <ArrowLeft className="w-4 h-4 text-slate-600" />
//           </button>
//           <div>
//             <h1 className="text-2xl font-black text-slate-900">Éditeur Post-Génération</h1>
//             <p className="text-xs text-slate-500 mt-0.5">
//               {hasProductImage
//                 ? "Mode 1 · Image fournie comme fond · Éditez les textes superposés"
//                 : "Mode 2 · Image générée · Éditez les textes et ajustements"}
//             </p>
//           </div>
//         </div>
//         <button
//           onClick={handleExport}
//           disabled={exporting}
//           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${
//             exported
//               ? "bg-emerald-500 text-white"
//               : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
//           }`}
//         >
//           {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
//           {exporting ? "Export..." : exported ? "Téléchargé !" : "Exporter HD"}
//         </button>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

//         {/* ════ PRÉVISUALISATION ════ */}
//         <div className="lg:col-span-6 flex flex-col items-center">

//           {/* Sélecteur de format en post-édition */}
//           <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
//             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Format :</span>
//             {(["1:1","9:16","16:9","4:3","3:4"] as const).map(f => (
//               <button
//                 key={f}
//                 onClick={() => handleFormatChange(f)}
//                 className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
//                   currentFormat === f
//                     ? "bg-blue-600 text-white border-transparent shadow"
//                     : "border-slate-200 text-slate-500 hover:border-slate-400"
//                 }`}
//               >
//                 {f}
//               </button>
//             ))}
//           </div>

//           <div
//             ref={previewRef}
//             className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-200"
//             style={{
//               width: dims.w,
//               height: dims.h,
//               maxWidth: "100%",
//             }}
//           >
//             {/* Image couvre tout le format sans espaces noirs */}
//             <img
//               src={poster.imageUrl}
//               alt="Affiche"
//               className="absolute inset-0 w-full h-full"
//               style={{
//                 objectFit: "cover",
//                 objectPosition: "center center",
//                 filter: previewFilter,
//               }}
//               draggable={false}
//             />

//             {/* Logo */}
//             {logoLayer && (
//               <div
//                 className="absolute cursor-move select-none"
//                 style={{
//                   left: `${logoLayer.x}%`,
//                   top: `${logoLayer.y}%`,
//                   width: `${logoLayer.width}%`,
//                   opacity: logoLayer.opacity,
//                 }}
//               >
//                 <img src={logoLayer.src} alt="Logo" className="w-full" draggable={false} />
//               </div>
//             )}

//             {/* ── FIX 2 : Couches texte avec fontSize scalée au format ── */}
//             {textLayers.map(layer => (
//               <div
//                 key={layer.id}
//                 onClick={() => setSelectedLayerId(layer.id)}
//                 className={`absolute select-none transition-all ${selectedLayerId === layer.id ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
//                 style={{
//                   left: `${layer.x}%`,
//                   top: `${layer.y}%`,
//                   transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
//                   opacity: layer.opacity,
//                   cursor: "pointer",
//                   fontFamily: layer.fontFamily,
//                   // ── FIX 2 : fontSize scalée proportionnellement au format ──
//                   fontSize: `${layer.fontSize * fontScale}px`,
//                   color: layer.color,
//                   fontWeight: layer.bold ? "bold" : "normal",
//                   fontStyle: layer.italic ? "italic" : "normal",
//                   textAlign: layer.align,
//                   whiteSpace: "nowrap",
//                   textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
//                   backgroundColor: layer.backgroundColor,
//                   padding: layer.backgroundColor
//                     ? `${(layer.backgroundPadding ?? 8) * fontScale}px ${(layer.backgroundPadding ?? 8) * 1.5 * fontScale}px`
//                     : undefined,
//                   borderRadius: layer.backgroundColor ? `${layer.backgroundRadius ?? 6}px` : undefined,
//                 }}
//               >
//                 {layer.content}
//               </div>
//             ))}
//           </div>

//           {/* Info mode */}
//           <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
//             hasProductImage
//               ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
//               : "bg-blue-50 text-blue-700 border border-blue-100"
//           }`}>
//             {hasProductImage ? <ImageIcon className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
//             {hasProductImage
//               ? "Image produit utilisée comme fond · Sans modification"
//               : "Affiche générée par IA · Textes superposés"}
//           </div>

//           {/* Hashtags */}
//           {analysis?.hashtags && analysis.hashtags.length > 0 && (
//             <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
//               {analysis.hashtags.map((tag: string) => (
//                 <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium">
//                   #{tag}
//                 </span>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* ════ PANNEAU ÉDITION ════ */}
//         <div className="lg:col-span-6 space-y-4">

//           {/* Onglets panneau */}
//           <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
//             {([
//               { id: "layers", label: "Textes", icon: <Type className="w-4 h-4" /> },
//               { id: "adjust", label: "Réglages", icon: <Sliders className="w-4 h-4" /> },
//               { id: "logo",   label: "Logo",    icon: <ImageIcon className="w-4 h-4" /> },
//             ] as { id: typeof activePanel; label: string; icon: React.ReactNode }[]).map(tab => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActivePanel(tab.id)}
//                 className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
//                   activePanel === tab.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
//                 }`}
//               >
//                 {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
//               </button>
//             ))}
//           </div>

//           {/* ── Panel: TEXTES ── */}
//           {activePanel === "layers" && (
//             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-3">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
//                   <Type className="w-4 h-4" /> Couches de texte
//                 </h3>
//                 <button
//                   onClick={addTextLayer}
//                   className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
//                 >
//                   <Plus className="w-3.5 h-3.5" /> Ajouter
//                 </button>
//               </div>

//               {textLayers.length === 0 ? (
//                 <div className="py-8 text-center">
//                   <Type className="w-8 h-8 text-slate-200 mx-auto mb-3" />
//                   <p className="text-sm text-slate-400 font-medium">Aucune couche texte</p>
//                   <p className="text-xs text-slate-300 mt-1">Cliquez "Ajouter" pour créer un texte</p>
//                 </div>
//               ) : (
//                 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
//                   {textLayers.map(layer => (
//                     <TextLayerCard
//                       key={layer.id}
//                       layer={layer}
//                       selected={selectedLayerId === layer.id}
//                       onSelect={() => setSelectedLayerId(layer.id)}
//                       onChange={updated => updateLayer(layer.id, updated)}
//                       onDelete={() => {
//                         deleteLayer(layer.id);
//                         if (selectedLayerId === layer.id) setSelectedLayerId(null);
//                       }}
//                     />
//                   ))}
//                 </div>
//               )}

//               <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
//                 Cliquez sur un texte dans la prévisualisation pour le sélectionner
//               </p>
//             </div>
//           )}

//           {/* ── Panel: RÉGLAGES IMAGE ── */}
//           {activePanel === "adjust" && (
//             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-5">
//               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
//                 <Sliders className="w-4 h-4" /> Réglages de l'image
//               </h3>

//               {[
//                 { key: "brightness" as const, label: "Luminosité", icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
//                 { key: "contrast"   as const, label: "Contraste",  icon: <Contrast className="w-4 h-4" />, min: -100, max: 100 },
//                 { key: "saturation" as const, label: "Saturation", icon: <Droplets className="w-4 h-4" />, min: -100, max: 100 },
//                 { key: "blur"       as const, label: "Flou",       icon: <Wind className="w-4 h-4" />, min: 0, max: 20 },
//               ].map(({ key, label, icon, min, max }) => (
//                 <div key={key}>
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
//                       <span className="text-slate-400">{icon}</span>
//                       {label}
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <span className="text-xs font-mono text-slate-500 w-10 text-right">{adjustments[key]}</span>
//                       <button
//                         onClick={() => setAdj(key, 0)}
//                         className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
//                       >
//                         Reset
//                       </button>
//                     </div>
//                   </div>
//                   <input
//                     type="range" min={min} max={max} value={adjustments[key]}
//                     onChange={e => setAdj(key, Number(e.target.value))}
//                     className="w-full accent-blue-500"
//                   />
//                   <div className="flex justify-between mt-0.5">
//                     <span className="text-[9px] text-slate-300">{min}</span>
//                     <span className="text-[9px] text-slate-300">{max}</span>
//                   </div>
//                 </div>
//               ))}

//               <button
//                 onClick={() => setEditorState(prev => ({ ...prev, adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 } }))}
//                 className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-2"
//               >
//                 <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser tous les réglages
//               </button>
//             </div>
//           )}

//           {/* ── Panel: LOGO ── */}
//           {activePanel === "logo" && (
//             <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-4">
//               <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
//                 <ImageIcon className="w-4 h-4" /> Logo de marque
//               </h3>

//               {!logoLayer ? (
//                 <button
//                   onClick={() => logoInputRef.current?.click()}
//                   className="w-full py-10 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl transition-all flex flex-col items-center gap-3 group"
//                 >
//                   <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
//                     <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
//                   </div>
//                   <div className="text-center">
//                     <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Ajouter votre logo</p>
//                     <p className="text-[10px] text-slate-400 mt-0.5">PNG avec transparence recommandé</p>
//                   </div>
//                 </button>
//               ) : (
//                 <div className="space-y-4">
//                   {/* Aperçu */}
//                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
//                     <img src={logoLayer.src} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-100" />
//                     <div className="flex-1">
//                       <p className="text-xs font-black text-slate-700">Logo chargé</p>
//                       <p className="text-[10px] text-slate-400">Ajustez la position et la taille ci-dessous</p>
//                     </div>
//                     <button onClick={() => setEditorState(prev => ({ ...prev, logoLayer: null }))}
//                       className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center">
//                       <X className="w-3.5 h-3.5" />
//                     </button>
//                   </div>

//                   {/* Position X/Y */}
//                   <div className="grid grid-cols-2 gap-3">
//                     {([
//                       { key: "x" as const, label: "Position X (%)" },
//                       { key: "y" as const, label: "Position Y (%)" },
//                     ]).map(({ key, label }) => (
//                       <div key={key}>
//                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
//                         <input type="range" min={0} max={90} value={logoLayer[key]}
//                           onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, [key]: Number(e.target.value) } : null }))}
//                           className="w-full accent-blue-500" />
//                         <span className="text-[10px] font-mono text-slate-500">{logoLayer[key]}%</span>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Taille & Opacité */}
//                   <div className="grid grid-cols-2 gap-3">
//                     <div>
//                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille (%)</p>
//                       <input type="range" min={5} max={50} value={logoLayer.width}
//                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, width: Number(e.target.value) } : null }))}
//                         className="w-full accent-blue-500" />
//                       <span className="text-[10px] font-mono text-slate-500">{logoLayer.width}%</span>
//                     </div>
//                     <div>
//                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
//                       <input type="range" min={0.1} max={1} step={0.05} value={logoLayer.opacity}
//                         onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, opacity: Number(e.target.value) } : null }))}
//                         className="w-full accent-blue-500" />
//                       <span className="text-[10px] font-mono text-slate-500">{Math.round(logoLayer.opacity * 100)}%</span>
//                     </div>
//                   </div>

//                   <button onClick={() => logoInputRef.current?.click()}
//                     className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
//                     Changer le logo
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Copier le texte marketing */}
//           {analysis?.marketingCopy && (
//             <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
//               <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Texte marketing généré</p>
//               <p className="text-sm text-slate-700 leading-relaxed">{analysis.marketingCopy}</p>
//               <button
//                 onClick={() => navigator.clipboard.writeText(analysis.marketingCopy)}
//                 className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
//               >
//                 <Copy className="w-3 h-3" /> Copier
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
//     </div>
//   );
// };

// export default ResultsPage;

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Download, ArrowLeft, Plus, Trash2, Move, Type,
  Sun, Contrast, Droplets, Wind, Image as ImageIcon,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp,
  Layers, Palette, Sliders, Check, X, Copy,
} from "lucide-react";
import {
  PosterData, TextLayer, LogoLayer, ImageAdjustments,
  PostEditorState, DEFAULT_POST_EDITOR, TextAlign,
} from "../lib/posterStudioTypes";
import { useMarketingWorkflow } from "../lib/marketingWorkflow";

// ─── Polices disponibles ──────────────────────────────────────────────────────

const FONTS = [
  "Arial", "Georgia", "Impact", "Helvetica",
  "Times New Roman", "Verdana", "Trebuchet MS",
  "Courier New", "Palatino", "Tahoma",
];

function generateId() { return Math.random().toString(36).substr(2, 9); }

// ─── Hook canvas export ───────────────────────────────────────────────────────

function usePosterExport() {
  const exportPoster = useCallback(async (
    imageUrl: string,
    textLayers: TextLayer[],
    logoLayer: LogoLayer | null,
    adjustments: ImageAdjustments,
    width: number,
    height: number
  ): Promise<string> => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Charger image de fond
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.filter = [
          `brightness(${1 + adjustments.brightness / 100})`,
          `contrast(${1 + adjustments.contrast / 100})`,
          `saturate(${1 + adjustments.saturation / 100})`,
          adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
        ].filter(Boolean).join(" ");

        // object-cover : l'image remplit tout le canvas sans espaces, recadrage centré
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = width / height;
        let sx: number, sy: number, sw: number, sh: number;
        if (imgAspect > canvasAspect) {
          // Image plus large que le canvas : crop horizontal centré
          sh = img.naturalHeight;
          sw = img.naturalHeight * canvasAspect;
          sx = (img.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          // Image plus haute que le canvas : crop vertical centré
          sw = img.naturalWidth;
          sh = img.naturalWidth / canvasAspect;
          sx = 0;
          sy = (img.naturalHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        ctx.filter = "none";
        resolve();
      };
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Dessiner logo
    if (logoLayer) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const logoW = (logoLayer.width / 100) * width;
          const logoH = (logoW / img.naturalWidth) * img.naturalHeight;
          ctx.globalAlpha = logoLayer.opacity;
          ctx.drawImage(img, (logoLayer.x / 100) * width, (logoLayer.y / 100) * height, logoW, logoH);
          ctx.globalAlpha = 1;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = logoLayer.src;
      });
    }

    // Dessiner textes
    for (const layer of textLayers) {
      if (!layer.content) continue;
      ctx.save();
      const x = (layer.x / 100) * width;
      const y = (layer.y / 100) * height;
      ctx.translate(x, y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.globalAlpha = layer.opacity;

      // fontSize stockée en base 512px → scaler au canvas export (même logique que preview CSS)
      const exportFontSize = layer.fontSize * (width / 512);
      const fontStr = `${layer.italic ? "italic " : ""}${layer.bold ? "bold " : ""}${exportFontSize}px "${layer.fontFamily}"`;
      ctx.font = fontStr;
      ctx.textAlign = layer.align as CanvasTextAlign;
      ctx.textBaseline = "middle";

      // Background du texte
      if (layer.backgroundColor) {
        const metrics = ctx.measureText(layer.content);
        const pad = (layer.backgroundPadding ?? 8) * (width / 512);
        const bw = metrics.width + pad * 2;
        const bh = exportFontSize + pad * 2;
        // bx : origine du rectangle selon l'alignement (le pad est déjà dans bw)
        const bx = layer.align === "center" ? -bw / 2 : layer.align === "right" ? -bw : -pad;
        ctx.fillStyle = layer.backgroundColor;
        const r = (layer.backgroundRadius ?? 6) * (width / 512);
        ctx.beginPath();
        ctx.roundRect(bx, -bh / 2, bw, bh, r);
        ctx.fill();
      }

      // Ombre portée légère
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.content, 0, 0);
      ctx.restore();
    }

    return canvas.toDataURL("image/png");
  }, []);

  return { exportPoster };
}

// ─── FIX 2 : Placement intelligent des éléments selon le format ──────────────

/**
 * Calcule les positions et tailles optimales des couches texte
 * selon le format de l'affiche (portrait, paysage, carré).
 * Zones : slogan=haut-centre, prix=haut-droite, promo=milieu, cta=bas-centre
 */
function getSmartLayout(format: string): {
  slogan:  { x: number; y: number; fontSize: number };
  price:   { x: number; y: number; fontSize: number };
  promo:   { x: number; y: number; fontSize: number };
  cta:     { x: number; y: number; fontSize: number };
} {
  // Portrait 9:16 (stories, téléphone)
  if (format === "9:16") {
    return {
      slogan: { x: 50, y: 12,  fontSize: 36 },
      price:  { x: 82, y: 82,  fontSize: 32 },
      promo:  { x: 50, y: 35,  fontSize: 26 },
      cta:    { x: 50, y: 91,  fontSize: 20 },
    };
  }
  // Paysage 16:9 (bannière, desktop)
  if (format === "16:9") {
    return {
      slogan: { x: 50, y: 14,  fontSize: 34 },
      price:  { x: 88, y: 75,  fontSize: 30 },
      promo:  { x: 30, y: 55,  fontSize: 24 },
      cta:    { x: 50, y: 88,  fontSize: 19 },
    };
  }
  // Portrait doux 3:4
  if (format === "3:4") {
    return {
      slogan: { x: 50, y: 13,  fontSize: 38 },
      price:  { x: 82, y: 80,  fontSize: 34 },
      promo:  { x: 50, y: 38,  fontSize: 27 },
      cta:    { x: 50, y: 90,  fontSize: 21 },
    };
  }
  // Paysage doux 4:3
  if (format === "4:3") {
    return {
      slogan: { x: 50, y: 13,  fontSize: 36 },
      price:  { x: 85, y: 78,  fontSize: 32 },
      promo:  { x: 35, y: 52,  fontSize: 25 },
      cta:    { x: 50, y: 89,  fontSize: 20 },
    };
  }
  // Carré 1:1 (par défaut)
  return {
    slogan: { x: 50, y: 13,  fontSize: 40 },
    price:  { x: 83, y: 80,  fontSize: 34 },
    promo:  { x: 50, y: 38,  fontSize: 28 },
    cta:    { x: 50, y: 90,  fontSize: 22 },
  };
}

// ─── TextLayerCard ────────────────────────────────────────────────────────────

const TextLayerCard: React.FC<{
  layer: TextLayer;
  selected: boolean;
  onSelect: () => void;
  onChange: (l: TextLayer) => void;
  onDelete: () => void;
}> = ({ layer, selected, onSelect, onChange, onDelete }) => {
  const [expanded, setExpanded] = useState(selected);
  useEffect(() => { if (selected) setExpanded(true); }, [selected]);

  const set = (updates: Partial<TextLayer>) => onChange({ ...layer, ...updates });

  const typeLabel: Record<TextLayer["type"], string> = {
    slogan: "Slogan", price: "Prix", promo: "Promo", cta: "CTA", custom: "Texte libre",
  };
  const typeColor: Record<TextLayer["type"], string> = {
    slogan: "bg-violet-100 text-violet-700",
    price:  "bg-emerald-100 text-emerald-700",
    promo:  "bg-orange-100 text-orange-700",
    cta:    "bg-blue-100 text-blue-700",
    custom: "bg-slate-100 text-slate-700",
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${selected ? "border-blue-400 shadow-md shadow-blue-100" : "border-slate-200"}`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeColor[layer.type]}`}>
          {typeLabel[layer.type]}
        </span>
        <span className="flex-1 text-xs font-medium text-slate-700 truncate">
          {layer.content || <span className="text-slate-400 italic">Vide</span>}
        </span>
        <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} className="text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Corps éditable */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3" onClick={e => e.stopPropagation()}>
          {/* Contenu */}
          <input
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium"
            placeholder="Contenu du texte..."
            value={layer.content}
            onChange={e => set({ content: e.target.value })}
          />

          {/* Police & taille */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Police</p>
              <select className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none"
                value={layer.fontFamily} onChange={e => set({ fontFamily: e.target.value })}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille</p>
              <div className="flex items-center gap-1">
                <input type="number" min={10} max={200}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none"
                  value={layer.fontSize} onChange={e => set({ fontSize: Number(e.target.value) })} />
                <span className="text-[10px] text-slate-400">px</span>
              </div>
            </div>
          </div>

          {/* Couleur & style */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <input type="color" value={layer.color} onChange={e => set({ color: e.target.value })}
                className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
              <span className="text-[10px] text-slate-500 font-mono">{layer.color}</span>
            </div>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => set({ bold: !layer.bold })}
                className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${layer.bold ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                <Bold className="w-3 h-3" />
              </button>
              <button onClick={() => set({ italic: !layer.italic })}
                className={`w-7 h-7 rounded-lg text-xs italic flex items-center justify-center transition-all ${layer.italic ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                <Italic className="w-3 h-3" />
              </button>
              {(["left", "center", "right"] as TextAlign[]).map(a => (
                <button key={a} onClick={() => set({ align: a })}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${layer.align === a ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {a === "left" ? <AlignLeft className="w-3 h-3" /> : a === "center" ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position X (%)</p>
              <input type="range" min={0} max={100} value={layer.x} onChange={e => set({ x: Number(e.target.value) })}
                className="w-full accent-blue-500" />
              <span className="text-[10px] text-slate-500 font-mono">{layer.x}%</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Position Y (%)</p>
              <input type="range" min={0} max={100} value={layer.y} onChange={e => set({ y: Number(e.target.value) })}
                className="w-full accent-blue-500" />
              <span className="text-[10px] text-slate-500 font-mono">{layer.y}%</span>
            </div>
          </div>

          {/* Rotation & Opacité */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rotation</p>
              <div className="flex items-center gap-1">
                <input type="range" min={-180} max={180} value={layer.rotation} onChange={e => set({ rotation: Number(e.target.value) })}
                  className="flex-1 accent-blue-500" />
                <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{layer.rotation}°</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
              <div className="flex items-center gap-1">
                <input type="range" min={0} max={1} step={0.05} value={layer.opacity} onChange={e => set({ opacity: Number(e.target.value) })}
                  className="flex-1 accent-blue-500" />
                <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Fond du texte */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] font-black text-slate-400 uppercase">Fond du texte</p>
              <button
                onClick={() => set({ backgroundColor: layer.backgroundColor ? undefined : "rgba(0,0,0,0.5)" })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${layer.backgroundColor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                {layer.backgroundColor ? "Activé" : "Désactivé"}
              </button>
            </div>
            {layer.backgroundColor && (
              <>
                <div className="flex items-center gap-2">
                  <input type="color" value={layer.backgroundColor.startsWith("rgba") ? "#000000" : layer.backgroundColor}
                    onChange={e => set({ backgroundColor: e.target.value + "99" })}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200" />
                  <input type="range" min={0} max={20} value={layer.backgroundPadding ?? 8}
                    onChange={e => set({ backgroundPadding: Number(e.target.value) })}
                    className="flex-1 accent-blue-500" />
                  <span className="text-[10px] text-slate-400">padding</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 w-16 shrink-0">Arrondi</span>
                  <input type="range" min={0} max={50} value={layer.backgroundRadius ?? 6}
                    onChange={e => set({ backgroundRadius: Number(e.target.value) })}
                    className="flex-1 accent-blue-500" />
                  <span className="text-[10px] text-slate-500 font-mono w-6 text-right">{layer.backgroundRadius ?? 6}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page Résultats + Éditeur ─────────────────────────────────────────────────

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { exportPoster } = usePosterExport();
  const { generatedPost, setPosterDraft } = useMarketingWorkflow();

  const poster: PosterData | undefined = location.state?.poster;
  const analysis = location.state?.analysis;
  const finalMarketingCopy = generatedPost?.body || analysis?.marketingCopy || "";

  const [editorState, setEditorState] = useState<PostEditorState>(DEFAULT_POST_EDITOR);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"layers" | "adjust" | "logo">("layers");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<string>(poster?.format ?? "1:1");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Recalculer les positions texte quand le format change ───────────────────
  const handleFormatChange = useCallback((newFormat: string) => {
    setCurrentFormat(newFormat);
    const layout = getSmartLayout(newFormat);
    setEditorState(prev => ({
      ...prev,
      textLayers: prev.textLayers.map(layer => {
        const pos = layout[layer.type as keyof ReturnType<typeof getSmartLayout>];
        if (!pos) return layer; // type "custom" → position non touchée
        return { ...layer, x: pos.x, y: pos.y, fontSize: pos.fontSize };
      }),
    }));
  }, []);

  // ── Initialiser les couches texte avec placement intelligent ────────────────
  useEffect(() => {
    if (!poster || !analysis) return;

    // Récupérer le layout intelligent selon le format initial
    const layout = getSmartLayout(poster.format);

    const layers: TextLayer[] = [];

    // Slogan — zone haute, centré, très visible
    if (analysis.slogan) {
      layers.push({
        id: generateId(),
        type: "slogan",
        content: analysis.slogan,
        x: layout.slogan.x,
        y: layout.slogan.y,
        fontSize: layout.slogan.fontSize,
        fontFamily: "Impact",
        color: "#FFFFFF",
        bold: true,
        italic: false,
        align: "center",
        rotation: 0,
        opacity: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        backgroundPadding: 14,
        backgroundRadius: 10,
      });
    }

    // Prix — zone basse-droite, badge doré bien visible
    if (analysis.generatedPrice) {
      layers.push({
        id: generateId(),
        type: "price",
        content: analysis.generatedPrice,
        x: layout.price.x,
        y: layout.price.y,
        fontSize: layout.price.fontSize,
        fontFamily: "Arial",
        color: "#FFD700",
        bold: true,
        italic: false,
        align: "center",
        rotation: 0,
        opacity: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        backgroundPadding: 12,
        backgroundRadius: 50,
      });
    }

    // Promo — zone milieu, légèrement incliné pour dynamisme
    if (analysis.generatedPromo) {
      layers.push({
        id: generateId(),
        type: "promo",
        content: analysis.generatedPromo,
        x: layout.promo.x,
        y: layout.promo.y,
        fontSize: layout.promo.fontSize,
        fontFamily: "Arial",
        color: "#FF4444",
        bold: true,
        italic: false,
        align: "center",
        rotation: -4,
        opacity: 1,
        backgroundColor: "#FFFFFF",
        backgroundPadding: 11,
        backgroundRadius: 6,
      });
    }

    // CTA — zone basse, centré, bouton arrondi bleu
    if (analysis.generatedCta) {
      layers.push({
        id: generateId(),
        type: "cta",
        content: analysis.generatedCta,
        x: layout.cta.x,
        y: layout.cta.y,
        fontSize: layout.cta.fontSize,
        fontFamily: "Arial",
        color: "#FFFFFF",
        bold: true,
        italic: false,
        align: "center",
        rotation: 0,
        opacity: 1,
        backgroundColor: "#2563EB",
        backgroundPadding: 15,
        backgroundRadius: 50,
      });
    }

    setEditorState(prev => ({ ...prev, textLayers: layers }));
  }, [poster, analysis]);

  if (!poster) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500">Aucun poster à afficher.</p>
        <button onClick={() => navigate("/")} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">
          Retour au générateur
        </button>
      </div>
    );
  }

  // Dimensions affiche selon format
  const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
    "1:1":  { w: 512, h: 512 },
    "9:16": { w: 360, h: 640 },
    "16:9": { w: 640, h: 360 },
    "4:3":  { w: 512, h: 384 },
    "3:4":  { w: 384, h: 512 },
  };
  const dims = FORMAT_DIMS[currentFormat] ?? { w: 512, h: 512 };

  const { textLayers, logoLayer, adjustments } = editorState;

  const setAdj = (key: keyof ImageAdjustments, value: number) =>
    setEditorState(prev => ({ ...prev, adjustments: { ...prev.adjustments, [key]: value } }));

  const addTextLayer = () => {
    const layer: TextLayer = {
      id: generateId(),
      type: "custom",
      content: "Nouveau texte",
      x: 50, y: 50,
      fontSize: 32,
      fontFamily: "Arial",
      color: "#FFFFFF",
      bold: false,
      italic: false,
      align: "center",
      rotation: 0,
      opacity: 1,
    };
    setEditorState(prev => ({ ...prev, textLayers: [...prev.textLayers, layer] }));
    setSelectedLayerId(layer.id);
  };

  const updateLayer = (id: string, updated: TextLayer) =>
    setEditorState(prev => ({
      ...prev,
      textLayers: prev.textLayers.map(l => l.id === id ? updated : l),
    }));

  const deleteLayer = (id: string) =>
    setEditorState(prev => ({
      ...prev,
      textLayers: prev.textLayers.filter(l => l.id !== id),
    }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const logo: LogoLayer = {
        id: generateId(),
        src: reader.result as string,
        x: 5, y: 5,
        width: 20,
        opacity: 1,
      };
      setEditorState(prev => ({ ...prev, logoLayer: logo }));
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportW = 1024;
      const exportH = Math.round(exportW * (dims.h / dims.w));
      const dataUrl = await exportPoster(
        poster.imageUrl, textLayers, logoLayer, adjustments, exportW, exportH
      );
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `affiche-${poster.id}.png`;
      a.click();
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error("Export:", err);
      alert("Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  };

  const handlePublish = () => {
    setPosterDraft({
      imageUrl: poster.imageUrl,
      format: currentFormat === "9:16" || currentFormat === "16:9" ? currentFormat : "1:1",
      mode: "generated",
    });
    navigate("/publish");
  };

  // Filtre CSS pour la prévisualisation
  const previewFilter = [
    adjustments.brightness !== 0 ? `brightness(${1 + adjustments.brightness / 100})` : "",
    adjustments.contrast !== 0 ? `contrast(${1 + adjustments.contrast / 100})` : "",
    adjustments.saturation !== 0 ? `saturate(${1 + adjustments.saturation / 100})` : "",
    adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : "",
  ].filter(Boolean).join(" ") || "none";

  const hasProductImage = poster.customization.userImages.some(i => i.role === "product");

  // ── FIX 2 : Échelle de police adaptée à la taille de prévisualisation ────────
  // Base de référence : 512px de largeur
  const fontScale = dims.w / 512;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Éditeur Post-Génération</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasProductImage
                ? "Mode 1 · Image fournie comme fond · Éditez les textes superposés"
                : "Mode 2 · Image générée · Éditez les textes et ajustements"}
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${
            exported
              ? "bg-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
          }`}
        >
          {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {exporting ? "Export..." : exported ? "Téléchargé !" : "Exporter HD"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ════ PRÉVISUALISATION ════ */}
        <div className="lg:col-span-6 flex flex-col items-center">

          {/* Sélecteur de format en post-édition */}
          <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Format :</span>
            {(["1:1","9:16","16:9","4:3","3:4"] as const).map(f => (
              <button
                key={f}
                onClick={() => handleFormatChange(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  currentFormat === f
                    ? "bg-blue-600 text-white border-transparent shadow"
                    : "border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div
            ref={previewRef}
            className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-200"
            style={{
              width: dims.w,
              height: dims.h,
              maxWidth: "100%",
            }}
          >
            {/* Image couvre tout le format sans espaces noirs */}
            <img
              src={poster.imageUrl}
              alt="Affiche"
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: "cover",
                objectPosition: "center center",
                filter: previewFilter,
              }}
              draggable={false}
            />

            {/* Logo */}
            {logoLayer && (
              <div
                className="absolute cursor-move select-none"
                style={{
                  left: `${logoLayer.x}%`,
                  top: `${logoLayer.y}%`,
                  width: `${logoLayer.width}%`,
                  opacity: logoLayer.opacity,
                }}
              >
                <img src={logoLayer.src} alt="Logo" className="w-full" draggable={false} />
              </div>
            )}

            {/* ── FIX 2 : Couches texte avec fontSize scalée au format ── */}
            {textLayers.map(layer => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`absolute select-none transition-all ${selectedLayerId === layer.id ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                  opacity: layer.opacity,
                  cursor: "pointer",
                  fontFamily: layer.fontFamily,
                  // ── FIX 2 : fontSize scalée proportionnellement au format ──
                  fontSize: `${layer.fontSize * fontScale}px`,
                  color: layer.color,
                  fontWeight: layer.bold ? "bold" : "normal",
                  fontStyle: layer.italic ? "italic" : "normal",
                  textAlign: layer.align,
                  whiteSpace: "nowrap",
                  textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
                  backgroundColor: layer.backgroundColor,
                  padding: layer.backgroundColor
                    ? `${(layer.backgroundPadding ?? 8) * fontScale}px ${(layer.backgroundPadding ?? 8) * 1.5 * fontScale}px`
                    : undefined,
                  borderRadius: layer.backgroundColor ? `${layer.backgroundRadius ?? 6}px` : undefined,
                }}
              >
                {layer.content}
              </div>
            ))}
          </div>

          {/* Info mode */}
          <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
            hasProductImage
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-blue-50 text-blue-700 border border-blue-100"
          }`}>
            {hasProductImage ? <ImageIcon className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
            {hasProductImage
              ? "Image produit utilisée comme fond · Sans modification"
              : "Affiche générée par IA · Textes superposés"}
          </div>

          {/* Hashtags */}
          {analysis?.hashtags && analysis.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {analysis.hashtags.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ════ PANNEAU ÉDITION ════ */}
        <div className="lg:col-span-6 space-y-4">

          {/* Onglets panneau */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            {([
              { id: "layers", label: "Textes", icon: <Type className="w-4 h-4" /> },
              { id: "adjust", label: "Réglages", icon: <Sliders className="w-4 h-4" /> },
              { id: "logo",   label: "Logo",    icon: <ImageIcon className="w-4 h-4" /> },
            ] as { id: typeof activePanel; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activePanel === tab.id ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Panel: TEXTES ── */}
          {activePanel === "layers" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
                  <Type className="w-4 h-4" /> Couches de texte
                </h3>
                <button
                  onClick={addTextLayer}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              {textLayers.length === 0 ? (
                <div className="py-8 text-center">
                  <Type className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">Aucune couche texte</p>
                  <p className="text-xs text-slate-300 mt-1">Cliquez "Ajouter" pour créer un texte</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {textLayers.map(layer => (
                    <TextLayerCard
                      key={layer.id}
                      layer={layer}
                      selected={selectedLayerId === layer.id}
                      onSelect={() => setSelectedLayerId(layer.id)}
                      onChange={updated => updateLayer(layer.id, updated)}
                      onDelete={() => {
                        deleteLayer(layer.id);
                        if (selectedLayerId === layer.id) setSelectedLayerId(null);
                      }}
                    />
                  ))}
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
                Cliquez sur un texte dans la prévisualisation pour le sélectionner
              </p>
            </div>
          )}

          {/* ── Panel: RÉGLAGES IMAGE ── */}
          {activePanel === "adjust" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-5">
              <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Réglages de l'image
              </h3>

              {[
                { key: "brightness" as const, label: "Luminosité", icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
                { key: "contrast"   as const, label: "Contraste",  icon: <Contrast className="w-4 h-4" />, min: -100, max: 100 },
                { key: "saturation" as const, label: "Saturation", icon: <Droplets className="w-4 h-4" />, min: -100, max: 100 },
                { key: "blur"       as const, label: "Flou",       icon: <Wind className="w-4 h-4" />, min: 0, max: 20 },
              ].map(({ key, label, icon, min, max }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="text-slate-400">{icon}</span>
                      {label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 w-10 text-right">{adjustments[key]}</span>
                      <button
                        onClick={() => setAdj(key, 0)}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <input
                    type="range" min={min} max={max} value={adjustments[key]}
                    onChange={e => setAdj(key, Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-slate-300">{min}</span>
                    <span className="text-[9px] text-slate-300">{max}</span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setEditorState(prev => ({ ...prev, adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 } }))}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser tous les réglages
              </button>
            </div>
          )}

          {/* ── Panel: LOGO ── */}
          {activePanel === "logo" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Logo de marque
              </h3>

              {!logoLayer ? (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl transition-all flex flex-col items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Ajouter votre logo</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG avec transparence recommandé</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Aperçu */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <img src={logoLayer.src} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-100" />
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-700">Logo chargé</p>
                      <p className="text-[10px] text-slate-400">Ajustez la position et la taille ci-dessous</p>
                    </div>
                    <button onClick={() => setEditorState(prev => ({ ...prev, logoLayer: null }))}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Position X/Y */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: "x" as const, label: "Position X (%)" },
                      { key: "y" as const, label: "Position Y (%)" },
                    ]).map(({ key, label }) => (
                      <div key={key}>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
                        <input type="range" min={0} max={90} value={logoLayer[key]}
                          onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, [key]: Number(e.target.value) } : null }))}
                          className="w-full accent-blue-500" />
                        <span className="text-[10px] font-mono text-slate-500">{logoLayer[key]}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Taille & Opacité */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taille (%)</p>
                      <input type="range" min={5} max={50} value={logoLayer.width}
                        onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, width: Number(e.target.value) } : null }))}
                        className="w-full accent-blue-500" />
                      <span className="text-[10px] font-mono text-slate-500">{logoLayer.width}%</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Opacité</p>
                      <input type="range" min={0.1} max={1} step={0.05} value={logoLayer.opacity}
                        onChange={e => setEditorState(prev => ({ ...prev, logoLayer: prev.logoLayer ? { ...prev.logoLayer, opacity: Number(e.target.value) } : null }))}
                        className="w-full accent-blue-500" />
                      <span className="text-[10px] font-mono text-slate-500">{Math.round(logoLayer.opacity * 100)}%</span>
                    </div>
                  </div>

                  <button onClick={() => logoInputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors">
                    Changer le logo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Copier le texte marketing */}
          {finalMarketingCopy && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Texte marketing généré</p>
              <p className="text-sm text-slate-700 leading-relaxed">{finalMarketingCopy}</p>
              <button
                onClick={() => navigator.clipboard.writeText(finalMarketingCopy)}
                className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Copy className="w-3 h-3" /> Copier
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end pr-20 pb-2 md:pr-24">
        <button
          onClick={handlePublish}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
        >
          <Check className="w-4 h-4" />
          Publier
        </button>
      </div>

      <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} />
    </div>
  );
};

export default ResultsPage;
