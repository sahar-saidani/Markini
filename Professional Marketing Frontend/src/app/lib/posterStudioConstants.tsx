
import { BusinessSector, VisualStyle } from "./posterStudioTypes";

export const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  accent: '#f59e0b',
  bg: '#f8fafc'
};

export const SECTORS = Object.values(BusinessSector);

export const FORMATS = [
  { label: 'Carré (1:1)', value: '1:1', desc: 'Idéal pour Instagram' },
  { label: 'Vertical (9:16)', value: '9:16', desc: 'Idéal pour Stories et A4' },
  { label: 'Paysage (16:9)', value: '16:9', desc: 'Idéal pour Publicités et Bannières' }
];

export const STYLES = Object.values(VisualStyle);

export const SAMPLE_POSTERS = [
  {
    title: 'Lancement Montre de Luxe',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    sector: 'Mode & Luxe'
  },
  {
    title: 'Sommet Tech 2025',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
    sector: 'Technologie & Startups'
  },
  {
    title: 'Burger Gourmet Promo',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    sector: 'Restauration & Boissons'
  }
];
