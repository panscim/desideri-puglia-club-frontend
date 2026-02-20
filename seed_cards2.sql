-- =============================================
-- SEEDING: 20 Nuove Card "Leggendarie" e "Rare" per la Puglia
-- Esegui questo script in Supabase Dashboard -> SQL Editor
-- =============================================

INSERT INTO public.cards (title, image_url, type, rarity, city, gps_lat, gps_lng, description, points_value)
VALUES 
    ('Trulli di Alberobello', 'https://images.unsplash.com/photo-1626084606766-3c0e35327916?auto=format&fit=crop&w=800&q=80', 'monument', 'legendary', 'Alberobello', 40.7831, 17.2374, 'Le iconiche abitazioni in pietra a secco, patrimonio UNESCO.', 500),
    ('Lama Monachile', 'https://images.unsplash.com/photo-1543789392-7f7243c9780a?auto=format&fit=crop&w=800&q=80', 'monument', 'legendary', 'Polignano a Mare', 40.9964, 17.2196, 'La celebre cala incastonata tra le scogliere di Polignano.', 500),
    ('Cattedrale di Trani', 'https://images.unsplash.com/photo-1627993430623-fb713364df24?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Trani', 41.2825, 16.4184, 'La cattedrale sul mare, capolavoro del romanico pugliese.', 300),
    ('Castel del Monte', 'https://images.unsplash.com/photo-1596485077271-70e176378415?auto=format&fit=crop&w=800&q=80', 'monument', 'legendary', 'Andria', 41.0847, 16.2709, 'L''enigmatica fortezza ottagonale di Federico II.', 500),
    ('Basilica di Santa Croce', 'https://images.unsplash.com/photo-1601389814456-4c4e72322055?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Lecce', 40.3533, 18.1738, 'Il trionfo del barocco leccese con la sua facciata ricamata.', 350),
    ('Anfiteatro Romano', 'https://images.unsplash.com/photo-1623861273934-2e0e014e7432?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Lecce', 40.3522, 18.1691, 'Antico teatro romano nel cuore di Piazza Sant''Oronzo.', 300),
    ('Cava di Bauxite', 'https://images.unsplash.com/photo-1618335349378-b118749e4939?auto=format&fit=crop&w=800&q=80', 'monument', 'common', 'Otranto', 40.1331, 18.5006, 'Un lago verde smeraldo circondato da terra rossa.', 200),
    ('Castello Aragonese', 'https://images.unsplash.com/photo-1623783777708-54c30c885368?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Otranto', 40.1456, 18.4925, 'Imponente fortificazione che domina il porto di Otranto.', 300),
    ('Pizzomunno', 'https://images.unsplash.com/photo-1625828230555-585804246695?auto=format&fit=crop&w=800&q=80', 'monument', 'common', 'Vieste', 41.8797, 16.1756, 'Il gigantesco monolite bianco simbolo di Vieste.', 200),
    ('Cattedrale di Ostuni', 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Ostuni', 40.7303, 17.5794, 'La cattedrale gotica che svetta sulla Città Bianca.', 300),
    ('Castello di Monopoli', 'https://images.unsplash.com/photo-1624022067710-1c0c16999677?auto=format&fit=crop&w=800&q=80', 'monument', 'common', 'Monopoli', 40.9535, 17.3060, 'Il castello Carlo V sul promontorio di Punta Penna.', 200),
    ('Ponte Acquedotto', 'https://images.unsplash.com/photo-1658428236162-811c7db52047?auto=format&fit=crop&w=800&q=80', 'monument', 'common', 'Gravina in Puglia', 40.8197, 16.4158, 'Suggestivo ponte che attraversa la gravina, set di 007.', 250),
    ('Santuario di San Michele', 'https://images.unsplash.com/photo-1629817296082-96c21e64627b?auto=format&fit=crop&w=800&q=80', 'monument', 'legendary', 'Monte Sant''Angelo', 41.7077, 15.9556, 'Antichissimo santuario micaelico, patrimonio UNESCO.', 500),
    ('Castello Aragonese (Taranto)', 'https://images.unsplash.com/photo-1596815857218-clbe8c8e7669?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Taranto', 40.4735, 17.2307, 'Fortezza sul mare a difesa del canale navigabile.', 350),
    ('Colonna Romana', 'https://images.unsplash.com/photo-1625906663231-1e9672051280?auto=format&fit=crop&w=800&q=80', 'monument', 'common', 'Brindisi', 40.6406, 17.9455, 'Terminale della via Appia, simbolo della città.', 200),
    ('Scavi di Egnazia', 'https://images.unsplash.com/photo-1616766467389-98335011986c?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Fasano', 40.8876, 17.3917, 'Resti di un''antica città messapica e romana sul mare.', 300),
    ('Basilica di San Nicola', 'https://images.unsplash.com/photo-1563816669-e7d6928e08d6?auto=format&fit=crop&w=800&q=80', 'monument', 'legendary', 'Bari', 41.1301, 16.8706, 'Capolavoro romanico che custodisce le reliquie del Santo.', 500),
    ('Teatro Petruzzelli', 'https://images.unsplash.com/photo-1579975095995-16353d995cb4?auto=format&fit=crop&w=800&q=80', 'monument', 'rare', 'Bari', 41.1232, 16.8725, 'Uno dei teatri più grandi e belli d''Italia.', 400),
    ('Grotta della Poesia', 'https://images.unsplash.com/photo-1560965319-fc41d184715f?auto=format&fit=crop&w=800&q=80', 'monument', 'common', 'Melendugno', 40.2858, 18.4286, 'Piscina naturale di straordinaria bellezza.', 250),
    ('Faro di Santa Maria di Leuca', 'https://images.unsplash.com/photo-1566378457-3a17e0b23269?auto=format&fit=crop&w=800&q=80', 'monument', 'legendary', 'Leuca', 39.7963, 18.3626, 'Il punto più a sud del tacco d''Italia, dove i mari si incontrano.', 500)
;
