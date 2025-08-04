-- Sample data for NTLP Conference Management System
-- Run this after schema.sql to populate the database with test data

-- Insert sample speakers
INSERT INTO speakers (name, title, biography, institution, email, keynote_speaker, research_interests) VALUES
('Dr. Sarah Johnson', 'Professor of Natural Language Processing', 'Dr. Johnson is a leading researcher in computational linguistics with over 15 years of experience in NLP and machine learning.', 'Stanford University', 'sarah.johnson@stanford.edu', true, 'Machine Translation, Sentiment Analysis, Neural Networks'),
('Prof. Michael Chen', 'Head of AI Research', 'Professor Chen specializes in deep learning applications for language understanding and has published over 100 papers in top-tier conferences.', 'MIT', 'mchen@mit.edu', true, 'Deep Learning, Language Models, Conversational AI'),
('Dr. Emma Rodriguez', 'Senior Research Scientist', 'Dr. Rodriguez works on multilingual NLP systems and has contributed to several open-source language processing tools.', 'Google Research', 'emma.rodriguez@google.com', false, 'Multilingual NLP, Cross-lingual Transfer Learning'),
('Dr. James Wilson', 'Associate Professor', 'Specializes in information extraction and knowledge graphs with applications in biomedical text mining.', 'Carnegie Mellon University', 'jwilson@cmu.edu', false, 'Information Extraction, Knowledge Graphs, Biomedical NLP');

-- Insert sample sessions
INSERT INTO sessions (title, description, start_time, end_time, date, location, session_type, track, speaker_ids) VALUES
('Opening Keynote: The Future of NLP', 'An inspiring keynote about the current state and future directions of natural language processing.', '09:00', '10:00', '2025-09-15', 'Main Auditorium', 'keynote', 'general', '[1]'),
('Recent Advances in Machine Translation', 'A presentation covering the latest breakthroughs in neural machine translation systems.', '10:30', '11:30', '2025-09-15', 'Conference Room A', 'presentation', 'translation', '[2]'),
('Workshop: Building Multilingual Applications', 'Hands-on workshop for developing NLP applications that work across multiple languages.', '14:00', '17:00', '2025-09-15', 'Workshop Room 1', 'workshop', 'multilingual', '[3]'),
('Panel: Ethics in AI and NLP', 'A panel discussion on ethical considerations in natural language processing research and applications.', '11:30', '12:30', '2025-09-16', 'Main Auditorium', 'panel', 'ethics', '[1,2,3,4]'),
('Closing Keynote: NLP in Industry', 'Industry perspectives on applying NLP research in real-world products and services.', '15:00', '16:00', '2025-09-16', 'Main Auditorium', 'keynote', 'industry', '[4]'),
('Poster Session A: Machine Learning Applications', 'Poster presentations on machine learning applications in NLP.', '15:00', '16:30', '2025-09-15', 'Exhibition Hall', 'poster', 'machine_learning', '[]'),
('Oral Session: Language Models', 'Oral presentations on recent advances in language modeling.', '13:30', '15:00', '2025-09-16', 'Conference Room B', 'presentation', 'language_models', '[]');

-- Insert sample activities
INSERT INTO activities (title, description, date, time, location, capacity, registration_required, category) VALUES
('Welcome Reception', 'Opening reception with networking opportunities, refreshments, and welcome remarks.', '2025-09-14', '18:00', 'Hotel Lobby', 200, true, 'networking'),
('City Walking Tour', 'Guided tour of the historic city center with stops at major landmarks.', '2025-09-15', '18:30', 'Hotel Entrance', 50, true, 'cultural'),
('Poster Session & Coffee Break', 'Poster presentations by students and researchers with coffee and networking.', '2025-09-15', '15:30', 'Exhibition Hall', 150, false, 'networking'),
('Conference Dinner', 'Formal dinner with awards ceremony and entertainment.', '2025-09-16', '19:00', 'Grand Ballroom', 180, true, 'social'),
('Deep Learning Workshop', 'Advanced workshop on implementing deep learning models for NLP tasks.', '2025-09-17', '09:00', 'Computer Lab', 30, true, 'workshop');

-- Insert sample announcements
INSERT INTO announcements (title, content, priority, type, published) VALUES
('Registration Now Open', 'Early bird registration is now available with a 20% discount until July 15th. Register now to secure your spot at NTLP 2025!', 'high', 'registration', true),
('Hotel Booking Deadline', 'Reminder: The deadline for booking accommodation at the conference hotel is August 1st. Book now to get the conference rate.', 'normal', 'accommodation', true),
('Call for Papers Extended', 'The deadline for paper submissions has been extended to June 30th due to popular demand.', 'normal', 'general', true),
('Transportation Information', 'Shuttle service will be provided between the airport and conference venue. Check the travel section for schedules.', 'normal', 'travel', true),
('Wi-Fi Information', 'Conference Wi-Fi credentials: Network: NTLP2025, Password: nlp2025guest', 'low', 'general', true);

-- Insert sample registrations
INSERT INTO registrations (first_name, last_name, email, institution, phone, position, country, session_track, registration_type, status, payment_status) VALUES
('Alice', 'Brown', 'alice.brown@university.edu', 'University of Technology', '+1-555-0101', 'PhD Student', 'USA', 'machine_learning', 'student', 'confirmed', 'paid'),
('Bob', 'Davis', 'bob.davis@company.com', 'Tech Solutions Inc.', '+1-555-0102', 'Senior Engineer', 'USA', 'industry', 'industry', 'confirmed', 'paid'),
('Carol', 'Miller', 'carol.miller@research.org', 'Research Institute', '+44-20-7946-0958', 'Research Scientist', 'UK', 'linguistics', 'academic', 'confirmed', 'paid'),
('David', 'Wilson', 'david.wilson@startup.io', 'AI Startup', '+1-555-0104', 'CTO', 'Canada', 'applications', 'industry', 'pending', 'unpaid'),
('Eva', 'Garcia', 'eva.garcia@universidad.es', 'Universidad Complutense', '+34-91-394-7000', 'Professor', 'Spain', 'multilingual', 'academic', 'confirmed', 'paid');

-- Insert sample abstracts
INSERT INTO abstracts (title, abstract, keywords, authors, corresponding_author_email, submission_type, track, submitted_by, status) VALUES
(
    'Neural Machine Translation with Attention Mechanisms for Low-Resource Languages',
    'This paper presents a novel approach to neural machine translation specifically designed for low-resource language pairs. We introduce an attention mechanism that leverages cross-lingual embeddings to improve translation quality when limited training data is available. Our experiments on five low-resource language pairs show significant improvements over baseline methods, achieving BLEU score improvements of up to 8.5 points. The proposed method is particularly effective for morphologically rich languages where traditional approaches struggle.',
    '["machine translation", "low-resource languages", "attention mechanisms", "neural networks", "cross-lingual embeddings"]',
    '[{"name": "Alice Brown", "email": "alice.brown@university.edu", "affiliation": "University of Technology"}, {"name": "Prof. Smith", "email": "smith@university.edu", "affiliation": "University of Technology"}]',
    'alice.brown@university.edu',
    'full_paper',
    'machine_translation',
    1,
    'accepted'
),
(
    'Sentiment Analysis in Social Media: A Multi-Modal Approach',
    'We propose a multi-modal sentiment analysis framework that combines textual and visual information from social media posts. Our approach uses transformer-based models for text processing and convolutional neural networks for image analysis, with a fusion mechanism that learns to weight the contribution of each modality. Experiments on three social media datasets demonstrate the effectiveness of our approach, showing 12% improvement in accuracy compared to text-only methods.',
    '["sentiment analysis", "social media", "multi-modal", "transformers", "deep learning"]',
    '[{"name": "Bob Davis", "email": "bob.davis@company.com", "affiliation": "Tech Solutions Inc."}]',
    'bob.davis@company.com',
    'abstract',
    'sentiment_analysis',
    2,
    'under_review'
),
(
    'Automated Question Generation for Educational Applications',
    'This work presents an automated question generation system designed for educational content. Using a fine-tuned T5 model, we generate diverse types of questions (factual, inferential, and analytical) from educational texts. The system is evaluated on educational materials from multiple domains, showing high quality questions as rated by human educators. A pilot study with 200 students demonstrates improved learning outcomes when using our generated questions.',
    '["question generation", "education", "T5", "automated assessment", "natural language generation"]',
    '[{"name": "Carol Miller", "email": "carol.miller@research.org", "affiliation": "Research Institute"}, {"name": "Dr. Johnson", "email": "johnson@research.org", "affiliation": "Research Institute"}]',
    'carol.miller@research.org',
    'full_paper',
    'education',
    3,
    'revision_required'
),
(
    'Cross-lingual Named Entity Recognition with Minimal Supervision',
    'We present a cross-lingual approach to named entity recognition that requires minimal supervision in the target language. Our method leverages multilingual BERT embeddings and a novel transfer learning strategy that adapts models trained on high-resource languages to low-resource targets. Evaluation on 10 languages shows competitive performance with fully supervised methods while requiring only 100 labeled examples in the target language.',
    '["named entity recognition", "cross-lingual", "transfer learning", "multilingual BERT", "low-resource"]',
    '[{"name": "Eva Garcia", "email": "eva.garcia@universidad.es", "affiliation": "Universidad Complutense"}]',
    'eva.garcia@universidad.es',
    'abstract',
    'information_extraction',
    5,
    'submitted'
),
(
    'Dialogue State Tracking with Graph Neural Networks',
    'This paper introduces a novel approach to dialogue state tracking using graph neural networks. We model the dialogue context as a dynamic graph where entities and their relationships evolve throughout the conversation. Our GNN-based tracker achieves state-of-the-art results on MultiWOZ 2.1 dataset with 94.2% joint goal accuracy, outperforming previous methods by 3.1 points.',
    '["dialogue systems", "state tracking", "graph neural networks", "conversational AI"]',
    '[{"name": "Dr. Wilson Research", "email": "wilson@ai-lab.edu", "affiliation": "AI Research Lab"}]',
    'wilson@ai-lab.edu',
    'poster',
    'dialogue_systems',
    NULL,
    'accepted'
);

-- Insert sample reviews
INSERT INTO reviews (abstract_id, reviewer_name, reviewer_email, score, comments, recommendation, detailed_feedback) VALUES
(1, 'Dr. Jane Smith', 'jane.smith@university.edu', 8, 'This is a well-written paper with solid experimental validation. The attention mechanism is novel and the results on low-resource languages are impressive. Minor issues with related work section.', 'accept', '{"originality": 8, "clarity": 9, "significance": 8, "technical_quality": 8}'),
(1, 'Prof. Mike Brown', 'mike.brown@institute.org', 7, 'Good work overall. The approach is sound but the improvement over baselines could be more substantial. The writing is clear and experiments are comprehensive.', 'accept', '{"originality": 7, "clarity": 8, "significance": 7, "technical_quality": 8}'),
(2, 'Dr. Lisa Johnson', 'lisa.johnson@research.com', 6, 'The multi-modal approach is interesting but the fusion mechanism needs more detailed explanation. Results are promising but more analysis is needed.', 'minor_revision', '{"originality": 7, "clarity": 6, "significance": 7, "technical_quality": 6}'),
(3, 'Prof. Robert Chen', 'robert.chen@edu.org', 5, 'The educational application is valuable but the evaluation methodology has some limitations. The pilot study sample size is too small for strong conclusions.', 'major_revision', '{"originality": 6, "clarity": 7, "significance": 6, "technical_quality": 5}'),
(4, 'Dr. Maria Rodriguez', 'maria.rodriguez@nlp.org', 9, 'Excellent work on cross-lingual NER. The minimal supervision approach is highly practical and results are very strong. Well-executed study.', 'accept', '{"originality": 9, "clarity": 9, "significance": 9, "technical_quality": 9}');

-- Link accepted abstracts to presentation sessions
INSERT INTO abstract_sessions (abstract_id, session_id, presentation_order, presentation_duration) VALUES
(1, 6, 1, 20), -- Neural MT paper in Poster Session A
(5, 7, 1, 15), -- Dialogue State Tracking in Oral Session
(1, 7, 2, 15); -- Neural MT paper also gets oral presentation
