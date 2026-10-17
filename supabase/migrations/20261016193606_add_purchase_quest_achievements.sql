-- Add 4 more achievements: first_purchase, first_quest_chest, first_flashcard, return_user

INSERT INTO achievements (code, title_ar, title_en, description_ar, description_en, icon, xp_reward, gem_reward, sort_order) VALUES
('first_purchase', 'أول عملية شراء', 'First Purchase', 'أول عملية شراء من المتجر', 'Made your first shop purchase', 'ShoppingBag', 20, 10, 21),
('first_quest_chest', 'صندوق المهام الأول', 'First Quest Chest', 'استلمت مكافأة المهام اليومية لأول مرة', 'Claimed your first daily quest reward', 'TreasureChest', 30, 15, 22),
('first_flashcard', 'أول بطاقة تعليمية', 'First Flashcard', 'راجعت أول بطاقة تعليمية', 'Reviewed your first flashcard', 'Layers', 20, 10, 23),
('comeback_3', 'عودة قوية', 'Strong Comeback', 'درست ٣ أيام بعد انقطاع', 'Studied 3 days after a break', 'RotateCcw', 30, 15, 24)
ON CONFLICT (code) DO NOTHING;
