/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.3-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: conf
-- ------------------------------------------------------
-- Server version	11.8.3-MariaDB-1+b1 from Debian

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `abstract_sessions`
--

DROP TABLE IF EXISTS `abstract_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `abstract_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `abstract_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `presentation_order` int(11) DEFAULT NULL,
  `presentation_duration` int(11) DEFAULT 15,
  `status` varchar(20) DEFAULT 'scheduled' CHECK (`status` in ('scheduled','confirmed','cancelled')),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `abstract_id` (`abstract_id`,`session_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `abstract_sessions_ibfk_1` FOREIGN KEY (`abstract_id`) REFERENCES `abstracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `abstract_sessions_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abstract_sessions`
--

LOCK TABLES `abstract_sessions` WRITE;
/*!40000 ALTER TABLE `abstract_sessions` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `abstract_sessions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `abstracts`
--

DROP TABLE IF EXISTS `abstracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `abstracts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(500) NOT NULL,
  `abstract` text NOT NULL,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`keywords`)),
  `authors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`authors`)),
  `corresponding_author_email` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `submission_type` varchar(50) DEFAULT 'abstract' CHECK (`submission_type` in ('abstract','full_paper','poster','demo')),
  `track` varchar(100) DEFAULT NULL,
  `subcategory` varchar(255) DEFAULT NULL,
  `cross_cutting_themes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cross_cutting_themes`)),
  `file_url` varchar(500) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  `filePath` varchar(500) DEFAULT NULL,
  `fileSize` int(11) DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'submitted' CHECK (`status` in ('submitted','under_review','accepted','rejected','revision_required','approved')),
  `format` varchar(20) DEFAULT 'oral' CHECK (`format` in ('oral','poster')),
  `admin_notes` text DEFAULT NULL,
  `reviewer_comments` text DEFAULT NULL,
  `final_decision_date` date DEFAULT NULL,
  `presentation_type` varchar(50) DEFAULT NULL CHECK (`presentation_type` in ('oral','poster','demo','not_assigned')),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_abstracts_status` (`status`),
  KEY `idx_abstracts_submitted_by` (`submitted_by`),
  CONSTRAINT `abstracts_ibfk_1` FOREIGN KEY (`submitted_by`) REFERENCES `registrations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abstracts`
--

LOCK TABLES `abstracts` WRITE;
/*!40000 ALTER TABLE `abstracts` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `abstracts` VALUES
(1,'Digital Health Innovations in Rural Uganda','Background: This study examines the implementation of digital health solutions in rural Uganda. Methods: We conducted a randomized controlled trial in 10 health centers. Findings: Digital tools improved health outcomes by 35%. Conclusion: Digital health interventions show significant promise in resource-limited settings.','[\"digital health\",\"rural health\",\"Uganda\"]','[{\"name\":\"Dr. John Doe\",\"email\":\"john.doe@example.com\",\"affiliation\":\"Makerere University\",\"position\":\"Senior Researcher\"}]','john.doe@example.com',NULL,'abstract','track_2','AI-powered diagnostics: Innovations and governance for TB, HIV, and cervical cancer','[\"digital_health\"]',NULL,NULL,NULL,NULL,NULL,'submitted','oral',NULL,NULL,NULL,NULL,'2025-08-29 07:38:09','2025-08-29 07:38:09'),
(2,'Mobile Health Solutions for Rural Healthcare','Background:\nRural healthcare faces significant challenges in Uganda with limited access to medical professionals.\n\nMethods:\nWe implemented a mobile health platform across 15 rural health centers and trained 50 community health workers.\n\nFindings:\nThe platform improved healthcare delivery efficiency by 40% and reduced patient wait times by 60%.\n\nConclusion:\nMobile health solutions show promising results for improving rural healthcare access and quality.','[\"mobile health\",\"rural healthcare\",\"digital health\"]','[{\"name\":\"Dr. Sarah Johnson\",\"email\":\"sarah.johnson@example.com\",\"affiliation\":\"Uganda Ministry of Health\",\"position\":\"Senior Health Officer\"}]','sarah.johnson@example.com',NULL,'abstract','track_2','Digital platforms for surveillance, early detection, and outbreak prediction','[\"digital_health\"]',NULL,NULL,NULL,NULL,NULL,'submitted','poster',NULL,NULL,NULL,NULL,'2025-08-29 07:41:01','2025-08-29 07:41:01'),
(3,'Voluptatem et laboru','Background:\nEt in sapiente labor\n\nMethods:\nAutem corporis conse\n\nFindings:\nVoluptatem Aliquip \n\nConclusion:\nAut irure tempor exc','[\"Molestiae enim exerc\"]','[{\"name\":\"Martena Hansen\",\"email\":\"vobyvifyp@mailinator.com\",\"affiliation\":\"Francis and Meyer Traders\",\"position\":\"Consequatur animi \"}]','vobyvifyp@mailinator.com',NULL,'abstract','Policy, Financing and Cross-Sector Integration','Social determinant-sensitive policymaking: Urban health, empowering young people for improved health through education and intersectoral action','[]','abstract_1754289637127_fay.pdf',NULL,NULL,NULL,NULL,'submitted','poster',NULL,NULL,NULL,NULL,'2025-08-29 07:41:54','2025-08-31 17:00:20'),
(4,'Test Abstract','Background: Test background\\nMethods: Test methods\\nFindings: Test findings\\nConclusion: Test conclusion','\"[\\\"test\\\",\\\"abstract\\\"]\"','\"[{\\\"name\\\":\\\"John Doe\\\",\\\"email\\\":\\\"john@test.com\\\",\\\"affiliation\\\":\\\"Test University\\\",\\\"position\\\":\\\"Researcher\\\"}]\"','john@test.com','john@test.com','abstract','track_1','Optimizing Laboratory Diagnostics in Integrated Health Systems','\"[]\"','abstract_1756660335662-test_abstract.txt','test_abstract.txt','uploads/1756660335662-test_abstract.txt',56,NULL,'submitted','oral',NULL,NULL,NULL,NULL,'2025-08-31 17:12:15','2025-08-31 17:24:10'),
(5,'Test Abstract 2','Background: Test background\\nMethods: Test methods\\nFindings: Test findings\\nConclusion: Test conclusion','\"[\\\"test\\\",\\\"abstract\\\"]\"','\"[{\\\"name\\\":\\\"Jane Doe\\\",\\\"email\\\":\\\"jane@test.com\\\",\\\"affiliation\\\":\\\"Test University\\\",\\\"position\\\":\\\"Researcher\\\"}]\"','jane@test.com','jane@test.com','abstract','track_1','Optimizing Laboratory Diagnostics in Integrated Health Systems','\"[]\"','abstract_1756660422311-test_abstract.txt','test_abstract.txt','uploads/1756660422311-test_abstract.txt',56,NULL,'submitted','oral',NULL,NULL,NULL,NULL,'2025-08-31 17:13:42','2025-08-31 17:24:10'),
(6,'Test Abstract 3','Background: Test background\\nMethods: Test methods\\nFindings: Test findings\\nConclusion: Test conclusion','\"[\\\"test\\\",\\\"abstract\\\"]\"','\"[{\\\"name\\\":\\\"Bob Smith\\\",\\\"email\\\":\\\"bob@test.com\\\",\\\"affiliation\\\":\\\"Test University\\\",\\\"position\\\":\\\"Researcher\\\"}]\"','bob@test.com','bob@test.com','abstract','track_1','Optimizing Laboratory Diagnostics in Integrated Health Systems','\"[]\"','abstract_1756660458719-test_abstract.txt','test_abstract.txt','uploads/1756660458719-test_abstract.txt',56,NULL,'submitted','oral',NULL,NULL,NULL,NULL,'2025-08-31 17:14:18','2025-08-31 17:24:10'),
(7,'Test Abstract 4','Background: Test background\\nMethods: Test methods\\nFindings: Test findings\\nConclusion: Test conclusion','\"[\\\"test\\\",\\\"abstract\\\"]\"','\"[{\\\"name\\\":\\\"Alice Johnson\\\",\\\"email\\\":\\\"alice@test.com\\\",\\\"affiliation\\\":\\\"Test University\\\",\\\"position\\\":\\\"Researcher\\\"}]\"','alice@test.com','alice@test.com','abstract','track_1','Optimizing Laboratory Diagnostics in Integrated Health Systems','\"[]\"','abstract_1756660527264-test_abstract.txt','test_abstract.txt','uploads/1756660527264-test_abstract.txt',56,NULL,'submitted','oral',NULL,NULL,NULL,NULL,'2025-08-31 17:15:27','2025-08-31 17:24:10'),
(8,'Exercitation culpa i','Background:\r\nNemo ea molestiae la\r\n\r\nMethods:\r\nOccaecat qui modi ex\r\n\r\nFindings:\r\nUt ex amet tempor d\r\n\r\nConclusion:\r\nMagna ratione quia n','\"[\\\"Quod sapiente provid\\\"]\"','\"[{\\\"name\\\":\\\"Camilla Sharpe\\\",\\\"email\\\":\\\"weci@mailinator.com\\\",\\\"affiliation\\\":\\\"Livingston and Morin Traders\\\",\\\"position\\\":\\\"Reprehenderit magni \\\"}]\"','weci@mailinator.com','weci@mailinator.com','abstract','Health System Resilience and Emergency Preparedness and Response','Strengthening infection prevention and control (IPC) in primary care; including ready to use isolation facilities.','\"[]\"','abstract_1756660708931-BREASTABSCESS.pdf','BREASTABSCESS.pdf','uploads/1756660708931-BREASTABSCESS.pdf',77898,NULL,'submitted','oral',NULL,NULL,NULL,NULL,'2025-08-31 17:18:28','2025-08-31 17:34:03'),
(9,'Omnis dolor sunt ver','Background:\r\nNisi debitis esse c\r\n\r\nMethods:\r\nRepellendus Ipsam e\r\n\r\nFindings:\r\nId dolorum accusamus\r\n\r\nConclusion:\r\nQui ut fugiat in ip','\"[\\\"Ut corrupti excepte\\\"]\"','\"[{\\\"name\\\":\\\"Cathleen Fowler\\\",\\\"email\\\":\\\"vaqywonuk@mailinator.com\\\",\\\"affiliation\\\":\\\"Lancaster and Leach Traders\\\",\\\"position\\\":\\\"Asperiores aut commo\\\"}]\"','vaqywonuk@mailinator.com','vaqywonuk@mailinator.com','abstract','Community Engagement for Disease Prevention and Elimination','Scaling community-led elimination efforts: Malaria, TB, neglected tropical diseases (NTDs), and leprosy and improving vaccine uptake','\"[]\"','abstract_1756661368940-ANTEPARTUM HAEMORRHAGE.pdf','ANTEPARTUM HAEMORRHAGE.pdf','uploads/1756661368940-ANTEPARTUM HAEMORRHAGE.pdf',62851,NULL,'submitted','poster',NULL,NULL,NULL,NULL,'2025-08-31 17:29:28','2025-08-31 17:33:23'),
(10,'Commodi consectetur','Background:\r\nNon rerum molestiae \r\n\r\nMethods:\r\nPraesentium odit cum\r\n\r\nFindings:\r\nNecessitatibus labor\r\n\r\nConclusion:\r\nEst irure Nam deleni','\"[\\\"Adipisci saepe labor\\\"]\"','\"[{\\\"name\\\":\\\"Christopher Compton\\\",\\\"email\\\":\\\"loso@mailinator.com\\\",\\\"affiliation\\\":\\\"Joyner and Perkins Co\\\",\\\"position\\\":\\\"Voluptatem eligendi \\\"}]\"','loso@mailinator.com','loso@mailinator.com','abstract','One Health','Public–private partnerships; Insurance, vouchers, and demand-side financing to reduce out-of-pocket expenditure','\"[]\"','abstract_1756668069522_FACE_PRESENTATION.pdf','FACE PRESENTATION.pdf','uploads/abstracts/abstract_1756668069522_FACE_PRESENTATION.pdf',81808,NULL,'submitted','poster',NULL,NULL,NULL,NULL,'2025-08-31 19:21:09','2025-08-31 19:21:09');
/*!40000 ALTER TABLE `abstracts` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `registration_required` tinyint(1) DEFAULT 0,
  `category` varchar(100) DEFAULT NULL CHECK (`category` in ('workshop','networking','social','cultural','other')),
  `current_registrations` int(11) DEFAULT 0,
  `status` varchar(20) DEFAULT 'active' CHECK (`status` in ('draft','active','cancelled','completed')),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `activity_registrations`
--

DROP TABLE IF EXISTS `activity_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` int(11) DEFAULT NULL,
  `registration_id` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'registered' CHECK (`status` in ('registered','waitlist','cancelled')),
  `registered_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `activity_id` (`activity_id`,`registration_id`),
  KEY `registration_id` (`registration_id`),
  CONSTRAINT `activity_registrations_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_registrations_ibfk_2` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_registrations`
--

LOCK TABLES `activity_registrations` WRITE;
/*!40000 ALTER TABLE `activity_registrations` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `activity_registrations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `admin_actions`
--

DROP TABLE IF EXISTS `admin_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `action_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`action_details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin_actions_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_actions`
--

LOCK TABLES `admin_actions` WRITE;
/*!40000 ALTER TABLE `admin_actions` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `admin_actions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `priority` varchar(20) DEFAULT 'normal' CHECK (`priority` in ('low','normal','high','urgent')),
  `type` varchar(50) DEFAULT 'general' CHECK (`type` in ('general','registration','program','travel','accommodation')),
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `published` tinyint(1) DEFAULT 0,
  `status` varchar(20) DEFAULT 'draft' CHECK (`status` in ('draft','published','archived')),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(20) DEFAULT 'submitted' CHECK (`status` in ('submitted','under_review','responded','closed','requires_followup')),
  `admin_notes` text DEFAULT NULL,
  `response` text DEFAULT NULL,
  `responded_by` int(11) DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contacts_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `contacts` VALUES
(1,'Test User','test@example.com','Test Contact','This is a test message','submitted',NULL,NULL,NULL,NULL,'2025-08-31 13:56:15','2025-08-31 13:56:15'),
(2,'Test Contact','test@example.com','Test Subject','Test message content','responded',NULL,NULL,NULL,NULL,'2025-08-31 16:21:28','2025-08-31 16:22:28'),
(3,'Idona Randall','navi@mailinator.com','Occaecat officia sin','Cillum non qui ratio','responded',NULL,NULL,NULL,NULL,'2025-08-31 16:44:56','2025-08-31 16:45:04');
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `file_uploads`
--

DROP TABLE IF EXISTS `file_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `entity_type` enum('registration','abstract','sponsorship','other') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `uploaded_by` varchar(255) NOT NULL,
  `upload_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_uploads`
--

LOCK TABLES `file_uploads` WRITE;
/*!40000 ALTER TABLE `file_uploads` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `file_uploads` VALUES
(1,'payment-proof-1756452253032-672710534.pdf','HIV_AIDS IN PREGNANCY.pdf','uploads/payment-proofs/payment-proof-1756452253032-672710534.pdf',289102,'application/pdf','registration',0,'pylyge@mailinator.com','pending','2025-08-29 07:24:13','2025-08-29 07:24:13'),
(2,'payment-proof-1756452876161-873830012.pdf','KANGAROO MOTHER CARE.pdf','uploads/payment-proofs/payment-proof-1756452876161-873830012.pdf',96438,'application/pdf','registration',0,'fujalivag@mailinator.com','pending','2025-08-29 07:34:36','2025-08-29 07:34:36'),
(3,'payment-proof-1756637133140-108331999.pdf','ABRUPTIO PLACENTA.pdf','uploads/payment-proofs/payment-proof-1756637133140-108331999.pdf',88895,'application/pdf','registration',0,'vewylu@mailinator.com','pending','2025-08-31 10:45:33','2025-08-31 10:45:33'),
(4,'payment-proof-1756637150803-787534548.pdf','KANGAROO MOTHER CARE.pdf','uploads/payment-proofs/payment-proof-1756637150803-787534548.pdf',96438,'application/pdf','registration',0,'hogefufu@mailinator.com','pending','2025-08-31 10:45:50','2025-08-31 10:45:50'),
(5,'payment-proof-1756637153954-26734094.pdf','KANGAROO MOTHER CARE.pdf','uploads/payment-proofs/payment-proof-1756637153954-26734094.pdf',96438,'application/pdf','registration',0,'hogefufu@mailinator.com','pending','2025-08-31 10:45:53','2025-08-31 10:45:53'),
(6,'payment-proof-1756654767148-747658228.pdf','CARE OF THE NEWBORN.pdf','uploads/payment-proofs/payment-proof-1756654767148-747658228.pdf',125069,'application/pdf','registration',0,'kagarapoge@mailinator.com','pending','2025-08-31 15:39:27','2025-08-31 15:39:27'),
(7,'payment-proof-1756657376047-655802894.pdf','KANGAROO MOTHER CARE.pdf','uploads/payment-proofs/payment-proof-1756657376047-655802894.pdf',96438,'application/pdf','registration',0,'guxehyf@mailinator.com','pending','2025-08-31 16:22:56','2025-08-31 16:22:56'),
(8,'payment-proof-1756657977338-151159058.pdf','CARE OF THE NEWBORN.pdf','uploads/payment-proofs/payment-proof-1756657977338-151159058.pdf',125069,'application/pdf','registration',0,'raliciwug@mailinator.com','pending','2025-08-31 16:32:57','2025-08-31 16:32:57'),
(9,'payment-proof-1756658013255-401300600.pdf','BREASTABSCESS.pdf','uploads/payment-proofs/payment-proof-1756658013255-401300600.pdf',77898,'application/pdf','registration',0,'woqy@mailinator.com','pending','2025-08-31 16:33:33','2025-08-31 16:33:33'),
(10,'payment-proof-1756659751943-647952883.pdf','EMNCG V5 (1) (AutoRecovered).pdf','uploads/payment-proofs/payment-proof-1756659751943-647952883.pdf',2876570,'application/pdf','registration',0,'volibuviz@mailinator.com','pending','2025-08-31 17:02:31','2025-08-31 17:02:31');
/*!40000 ALTER TABLE `file_uploads` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `form_submissions`
--

DROP TABLE IF EXISTS `form_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `form_type` varchar(50) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `submitted_by` varchar(255) NOT NULL,
  `submission_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`submission_data`)),
  `status` varchar(50) DEFAULT 'submitted' CHECK (`status` in ('submitted','under_review','approved','rejected','requires_followup','revision_required')),
  `admin_notes` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_comments` text DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'normal' CHECK (`priority` in ('low','normal','high','urgent')),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_form_submissions_status` (`status`),
  KEY `idx_form_submissions_type` (`form_type`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_submissions`
--

LOCK TABLES `form_submissions` WRITE;
/*!40000 ALTER TABLE `form_submissions` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `form_submissions` VALUES
(10,'registration',4,'test@example.com','{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"registrationType\":\"delegate\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 13:14:19','2025-08-31 13:14:19'),
(11,'registration',5,'test2@example.com','{\"firstName\":\"Test\",\"lastName\":\"User2\",\"email\":\"test2@example.com\",\"registrationType\":\"delegate\",\"country\":\"Uganda\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 13:27:53','2025-08-31 13:27:53'),
(12,'registration',6,'test3@example.com','{\"firstName\":\"Test\",\"lastName\":\"User3\",\"email\":\"test3@example.com\",\"registrationType\":\"delegate\",\"country\":\"Uganda\"}','approved',NULL,NULL,'2025-08-31 16:16:20',NULL,'normal','2025-08-31 13:56:35','2025-08-31 16:16:20'),
(13,'registration',7,'testreg8@example.com','{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"testreg8@example.com\",\"phone\":\"+256701234567\",\"organization\":\"Test Org\",\"position\":\"Developer\",\"country\":\"Uganda\",\"registrationType\":\"local\",\"specialRequirements\":\"None\",\"dietary_requirements\":\"None\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:32:17','2025-08-31 16:32:17'),
(14,'registration',8,'raliciwug@mailinator.com','{\"firstName\":\"Tamara\",\"lastName\":\"Hardy\",\"email\":\"raliciwug@mailinator.com\",\"phone\":\"+1 (934) 742-6981\",\"organization\":\"Lawson Sanders Plc\",\"position\":\"Iusto totam nihil id\",\"country\":\"Spencer Brewer Trading\",\"registrationType\":\"local\",\"specialRequirements\":\"Laudantium ea asper\",\"dietary_requirements\":\"\",\"paymentProofUrl\":\"uploads/payment-proofs/payment-proof-1756657977338-151159058.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:32:57','2025-08-31 16:32:57'),
(15,'registration',9,'woqy@mailinator.com','{\"firstName\":\"petero\",\"lastName\":\"Allison\",\"email\":\"woqy@mailinator.com\",\"phone\":\"+1 (273) 684-2713\",\"organization\":\"Wolfe Mckay Associates\",\"position\":\"Iure adipisci possim\",\"country\":\"Mcmillan Becker Plc\",\"registrationType\":\"grad\",\"specialRequirements\":\"Iure ab officiis inv\",\"dietary_requirements\":\"\",\"paymentProofUrl\":\"uploads/payment-proofs/payment-proof-1756658013255-401300600.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:33:33','2025-08-31 16:33:33'),
(16,'registration',10,'testreg9@example.com','{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"testreg9@example.com\",\"phone\":\"+256701234567\",\"organization\":\"Test Org\",\"position\":\"Developer\",\"country\":\"Uganda\",\"registrationType\":\"local\",\"specialRequirements\":\"None\",\"dietary_requirements\":\"None\",\"paymentProofUrl\":\"test_payment.pdf\"}','approved',NULL,NULL,'2025-08-31 16:44:34',NULL,'normal','2025-08-31 16:40:27','2025-08-31 16:44:34'),
(17,'registration',11,'testreg10@example.com','{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"testreg10@example.com\",\"phone\":\"+256701234567\",\"organization\":\"Test Org\",\"position\":\"Developer\",\"country\":\"Uganda\",\"registrationType\":\"local\",\"specialRequirements\":\"None\",\"dietary_requirements\":\"None\",\"paymentProofUrl\":\"test_payment.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:41:23','2025-08-31 16:41:23'),
(18,'registration',12,'testreg11@example.com','{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"testreg11@example.com\",\"phone\":\"+256701234567\",\"organization\":\"Test Org\",\"position\":\"Developer\",\"country\":\"Uganda\",\"registrationType\":\"local\",\"specialRequirements\":\"None\",\"dietary_requirements\":\"None\",\"paymentProofUrl\":\"test_payment.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:42:16','2025-08-31 16:42:16'),
(19,'registration',13,'testreg12@example.com','{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"testreg12@example.com\",\"phone\":\"+256701234567\",\"organization\":\"Test Org\",\"position\":\"Developer\",\"country\":\"Uganda\",\"registrationType\":\"local\",\"specialRequirements\":\"None\",\"dietary_requirements\":\"None\",\"paymentProofUrl\":\"test_payment.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:42:57','2025-08-31 16:42:57'),
(20,'registration',14,'debug@example.com','{\"firstName\":\"Debug\",\"lastName\":\"Test\",\"email\":\"debug@example.com\",\"phone\":\"+256701234567\",\"organization\":\"Test Org\",\"position\":\"Developer\",\"country\":\"Uganda\",\"registrationType\":\"local\",\"specialRequirements\":\"None\",\"dietary_requirements\":\"None\",\"paymentProofUrl\":\"debug_payment.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:44:29','2025-08-31 16:44:29'),
(21,'registration',15,'debug2@example.com','{\"firstName\":\"Debug2\",\"lastName\":\"Test\",\"email\":\"debug2@example.com\",\"phone\":\"+256701234567\",\"organization\":\"Test Org\",\"position\":\"Developer\",\"country\":\"Uganda\",\"registrationType\":\"local\",\"specialRequirements\":\"None\",\"dietary_requirements\":\"None\",\"paymentProofUrl\":\"debug2_payment.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:45:33','2025-08-31 16:45:33'),
(22,'sponsorship',4,'Test Company - John Doe','{\"companyName\":\"Test Company\",\"contactPerson\":\"John Doe\",\"email\":\"test@company.com\",\"phone\":\"+256701234567\",\"website\":\"https://test.com\",\"industry\":\"Technology\",\"specialRequirements\":\"None\",\"selectedPackage\":\"Gold Sponsor\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 16:59:17','2025-08-31 16:59:17'),
(23,'sponsorship',5,'Massey Moses Inc - Iusto laboriosam se','{\"companyName\":\"Massey Moses Inc\",\"contactPerson\":\"Iusto laboriosam se\",\"email\":\"juze@mailinator.com\",\"phone\":\"+1 (385) 496-9569\",\"website\":\"https://www.hegobiru.me\",\"industry\":\"Nobis et voluptatem\",\"specialRequirements\":\"Sit non quaerat ali\",\"selectedPackage\":\"Bronze Sponsor\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 17:01:59','2025-08-31 17:01:59'),
(24,'registration',16,'volibuviz@mailinator.com','{\"firstName\":\"Kameko\",\"lastName\":\"Glover\",\"email\":\"volibuviz@mailinator.com\",\"phone\":\"+1 (377) 233-6203\",\"organization\":\"Robles and Sosa Traders\",\"position\":\"Obcaecati ea deserun\",\"country\":\"Solis Callahan Traders\",\"registrationType\":\"local\",\"specialRequirements\":\"Et cillum dolores se\",\"dietary_requirements\":\"\",\"paymentProofUrl\":\"uploads/payment-proofs/payment-proof-1756659751943-647952883.pdf\"}','submitted',NULL,NULL,NULL,NULL,'normal','2025-08-31 17:02:31','2025-08-31 17:02:31');
/*!40000 ALTER TABLE `form_submissions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `session_track` varchar(100) DEFAULT NULL,
  `registration_type` varchar(50) DEFAULT NULL CHECK (`registration_type` in ('undergrad','grad','local','intl','online','delegate')),
  `dietary_requirements` text DEFAULT NULL,
  `special_needs` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'submitted' CHECK (`status` in ('submitted','under_review','approved','rejected','waitlist','cancelled')),
  `admin_notes` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_comments` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `payment_status` enum('pending','verified','rejected') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_registrations_status` (`status`),
  KEY `idx_registrations_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `registrations` VALUES
(1,'Test','User','testuser@example.com',NULL,NULL,NULL,'Test Org','+256700123456','Developer','Kampala',NULL,'local',NULL,'None','submitted',NULL,NULL,NULL,NULL,'2025-08-29 07:27:02','2025-08-29 07:27:02',NULL,'pending'),
(2,'Jane','Doe','jane.doe@example.com',NULL,NULL,NULL,'Health Ministry','+256700123457','Doctor','Kampala',NULL,'local',NULL,'Wheelchair access','approved',NULL,NULL,'2025-08-31 16:16:26',NULL,'2025-08-29 07:27:38','2025-08-31 16:16:26',NULL,'pending'),
(5,'Test','User2','test2@example.com',NULL,NULL,NULL,NULL,NULL,NULL,'Uganda',NULL,'delegate',NULL,NULL,'submitted',NULL,NULL,NULL,NULL,'2025-08-31 13:27:53','2025-08-31 13:27:53',NULL,'pending'),
(7,'Test','User','testreg8@example.com',NULL,NULL,NULL,'Test Org','+256701234567','Developer','Uganda',NULL,'local','None','None','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:32:17','2025-08-31 16:32:17',NULL,'pending'),
(8,'Tamara','Hardy','raliciwug@mailinator.com',NULL,NULL,NULL,'Lawson Sanders Plc','+1 (934) 742-6981','Iusto totam nihil id','Spencer Brewer Trading',NULL,'local',NULL,'Laudantium ea asper','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:32:57','2025-08-31 16:32:57',NULL,'pending'),
(9,'petero','Allison','woqy@mailinator.com',NULL,NULL,NULL,'Wolfe Mckay Associates','+1 (273) 684-2713','Iure adipisci possim','Mcmillan Becker Plc',NULL,'grad',NULL,'Iure ab officiis inv','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:33:33','2025-08-31 16:33:33',NULL,'pending'),
(10,'Test','User','testreg9@example.com',NULL,NULL,NULL,'Test Org','+256701234567','Developer','Uganda',NULL,'local','None','None','approved',NULL,NULL,'2025-08-31 16:44:34',NULL,'2025-08-31 16:40:27','2025-08-31 16:44:34',NULL,'pending'),
(11,'Test','User','testreg10@example.com',NULL,NULL,NULL,'Test Org','+256701234567','Developer','Uganda',NULL,'local','None','None','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:41:23','2025-08-31 16:41:23',NULL,'pending'),
(12,'Test','User','testreg11@example.com',NULL,NULL,NULL,'Test Org','+256701234567','Developer','Uganda',NULL,'local','None','None','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:42:16','2025-08-31 16:42:16',NULL,'pending'),
(13,'Test','User','testreg12@example.com',NULL,NULL,NULL,'Test Org','+256701234567','Developer','Uganda',NULL,'local','None','None','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:42:57','2025-08-31 16:42:57',NULL,'pending'),
(14,'Debug','Test','debug@example.com',NULL,NULL,NULL,'Test Org','+256701234567','Developer','Uganda',NULL,'local','None','None','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:44:29','2025-08-31 16:44:29',NULL,'pending'),
(15,'Debug2','Test','debug2@example.com',NULL,NULL,NULL,'Test Org','+256701234567','Developer','Uganda',NULL,'local','None','None','submitted',NULL,NULL,NULL,NULL,'2025-08-31 16:45:33','2025-08-31 16:45:33','debug2_payment.pdf','pending'),
(16,'Kameko','Glover','volibuviz@mailinator.com',NULL,NULL,NULL,'Robles and Sosa Traders','+1 (377) 233-6203','Obcaecati ea deserun','Solis Callahan Traders',NULL,'local',NULL,'Et cillum dolores se','submitted',NULL,NULL,NULL,NULL,'2025-08-31 17:02:31','2025-08-31 17:23:44','payment-proof-1756659751943-647952883.pdf','pending');
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `abstract_id` int(11) DEFAULT NULL,
  `reviewer_name` varchar(255) NOT NULL,
  `reviewer_email` varchar(255) NOT NULL,
  `score` int(11) DEFAULT NULL CHECK (`score` >= 1 and `score` <= 10),
  `comments` text DEFAULT NULL,
  `recommendation` varchar(50) DEFAULT NULL CHECK (`recommendation` in ('accept','reject','minor_revision','major_revision')),
  `detailed_feedback` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detailed_feedback`)),
  `status` varchar(20) DEFAULT 'submitted' CHECK (`status` in ('submitted','approved','rejected')),
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `abstract_id` (`abstract_id`,`reviewer_email`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`abstract_id`) REFERENCES `abstracts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `session_registrations`
--

DROP TABLE IF EXISTS `session_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) DEFAULT NULL,
  `registration_id` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'registered' CHECK (`status` in ('registered','waitlist','cancelled')),
  `registered_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`,`registration_id`),
  KEY `registration_id` (`registration_id`),
  CONSTRAINT `session_registrations_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `session_registrations_ibfk_2` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session_registrations`
--

LOCK TABLES `session_registrations` WRITE;
/*!40000 ALTER TABLE `session_registrations` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `session_registrations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `date` date NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `session_type` varchar(100) DEFAULT NULL CHECK (`session_type` in ('keynote','presentation','panel','workshop','poster','break')),
  `track` varchar(100) DEFAULT NULL,
  `speaker_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`speaker_ids`)),
  `capacity` int(11) DEFAULT NULL,
  `registration_required` tinyint(1) DEFAULT 0,
  `current_registrations` int(11) DEFAULT 0,
  `status` varchar(20) DEFAULT 'draft' CHECK (`status` in ('draft','published','cancelled','completed')),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `speakers`
--

DROP TABLE IF EXISTS `speakers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `speakers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `biography` text NOT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `twitter_url` varchar(500) DEFAULT NULL,
  `website_url` varchar(500) DEFAULT NULL,
  `research_interests` text DEFAULT NULL,
  `keynote_speaker` tinyint(1) DEFAULT 0,
  `status` varchar(20) DEFAULT 'pending' CHECK (`status` in ('pending','approved','rejected')),
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `speakers`
--

LOCK TABLES `speakers` WRITE;
/*!40000 ALTER TABLE `speakers` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `speakers` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `sponsorships`
--

DROP TABLE IF EXISTS `sponsorships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsorships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `package_type` varchar(100) DEFAULT NULL CHECK (`package_type` in ('platinum','gold','silver','bronze','custom')),
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `status` varchar(20) DEFAULT 'submitted' CHECK (`status` in ('submitted','under_review','approved','rejected','negotiating','confirmed')),
  `payment_status` varchar(20) DEFAULT 'pending' CHECK (`payment_status` in ('pending','partial','completed','overdue')),
  `admin_notes` text DEFAULT NULL,
  `contract_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_reference` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `special_requirements` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sponsorships_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sponsorships`
--

LOCK TABLES `sponsorships` WRITE;
/*!40000 ALTER TABLE `sponsorships` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `sponsorships` VALUES
(1,'Test Company Ltd','John Smith','john.smith@company.com','+256700123456','gold',NULL,'USD','submitted','pending',NULL,NULL,'2025-08-29 07:14:47','2025-08-29 07:14:47',NULL,NULL,NULL,NULL),
(2,'Test Company 2','Jane Doe','jane@test.com','+256700000000','silver',NULL,'USD','submitted','pending',NULL,NULL,'2025-08-29 07:21:13','2025-08-29 07:21:13',NULL,NULL,NULL,NULL),
(3,'Medina Mcfadden Traders','Quod sed reiciendis ','fowul@mailinator.com','+1 (314) 892-5004','silver',NULL,'USD','submitted','pending',NULL,NULL,'2025-08-29 07:34:48','2025-08-29 07:34:48',NULL,NULL,NULL,NULL),
(4,'Test Company','John Doe','test@company.com','+256701234567','gold',NULL,'USD','submitted','pending',NULL,'test_contract.pdf','2025-08-31 16:59:17','2025-08-31 17:00:39',NULL,'https://test.com','Technology','None'),
(5,'Massey Moses Inc','Iusto laboriosam se','juze@mailinator.com','+1 (385) 496-9569','bronze',NULL,'USD','submitted','pending',NULL,NULL,'2025-08-31 17:01:59','2025-08-31 17:01:59',NULL,'https://www.hegobiru.me','Nobis et voluptatem','Sit non quaerat ali');
/*!40000 ALTER TABLE `sponsorships` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-09-01  0:08:00
