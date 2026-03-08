-- =============================================
-- SEEDING: 10 Card Speciali per Barletta
-- Esegui questo script in Supabase Dashboard -> SQL Editor
-- =============================================

INSERT INTO public.cards (title, image_url, type, rarity, city, gps_lat, gps_lng, description, points_value)
VALUES 
    ('Eraclio – Il Colosso', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Barletta_Eraclio_e_Basilica_del_Santo_Sepolcro.jpg/800px-Barletta_Eraclio_e_Basilica_del_Santo_Sepolcro.jpg', 'monument', 'legendary', 'Barletta', 41.31929, 16.28148, 'Il gigante di bronzo che veglia sulla città. Simbolo del porto.', 500),
    ('Castello Svevo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Castello_di_Barletta.jpg/800px-Castello_di_Barletta.jpg', 'monument', 'rare', 'Barletta', 41.32042, 16.28828, 'Imponente fortezza Federiciana, custode di storia e cultura.', 350),
    ('Cattedrale S. Maria Maggiore', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Cattedrale_Barletta.jpg/800px-Cattedrale_Barletta.jpg', 'monument', 'legendary', 'Barletta', 41.32056, 16.28611, 'Maestoso esempio di fusione tra stile romanico e gotico.', 500),
    ('Basilica del Santo Sepolcro', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Barletta_Santo_Sepolcro.jpg/800px-Barletta_Santo_Sepolcro.jpg', 'monument', 'rare', 'Barletta', 41.31917, 16.28111, 'Basilica romanica crocevia per i pellegrini verso la Terra Santa.', 350),
    ('Pinacoteca De Nittis', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Palazzo_della_Marra_Barletta.jpg/800px-Palazzo_della_Marra_Barletta.jpg', 'monument', 'rare', 'Barletta', 41.32127, 16.28159, 'Collezione impressionista del celebre pittore barlettano.', 350),
    ('Palazzo della Marra', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Barletta_Palazzo_della_Marra.jpg/800px-Barletta_Palazzo_della_Marra.jpg', 'monument', 'common', 'Barletta', 41.32127, 16.28159, 'Splendido palazzo barocco con balconi finemente decorati.', 200),
    ('Cantina della Disfida', 'https://live.staticflickr.com/3910/14418364805_4177d63682_b.jpg', 'monument', 'legendary', 'Barletta', 41.31928, 16.28399, 'Luogo storico dove fu lanciata l''offesa che portò alla Disfida.', 500),
    ('Porta Marina', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Porta_Marina_Barletta.jpg/800px-Porta_Marina_Barletta.jpg', 'monument', 'common', 'Barletta', 41.32304, 16.28464, 'Antico accesso alla città dal mare, testimone di scambi e commerci.', 200),
    ('Teatro Curci', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Teatro_Curci_Barletta.jpg/800px-Teatro_Curci_Barletta.jpg', 'monument', 'rare', 'Barletta', 41.31986, 16.27959, 'Prestigioso teatro cittadino, tempio della lirica e della prosa.', 350),
    ('Museo Civico', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Castello_di_Barletta.jpg/800px-Castello_di_Barletta.jpg', 'monument', 'common', 'Barletta', 41.32042, 16.28828, 'Raccolta di reperti storici e artistici all''interno del Castello.', 200);
