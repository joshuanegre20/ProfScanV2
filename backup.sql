-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               9.6.0 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.15.0.7171
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table profscan_db.activities
CREATE TABLE IF NOT EXISTS `activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `instructor_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scanned_schedule` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `device_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.activities: ~121 rows (approximately)
INSERT INTO `activities` (`id`, `instructor_id`, `staff_id`, `name`, `type`, `college`, `subject`, `scanned_schedule`, `created_at`, `updated_at`, `device_id`, `success`, `message`) VALUES
	(1, '9-99999', NULL, 'Trisha Anabeza', 'schedule_create', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-16 08:58:42', '2026-03-16 08:58:42', '2', 0, NULL),
	(2, NULL, NULL, 'bagyoo', 'event_create', NULL, NULL, NULL, '2026-03-16 08:59:57', '2026-03-16 08:59:57', NULL, 0, NULL),
	(3, NULL, NULL, 'pahuway napud', 'event_create', NULL, NULL, NULL, '2026-03-16 09:01:16', '2026-03-16 09:01:16', NULL, 0, NULL),
	(4, '9-99999', NULL, 'Trisha Anabeza', 'schedule_delete', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-16 09:02:05', '2026-03-16 09:02:05', '2', 0, NULL),
	(5, '9-99999', NULL, 'Trisha Anabeza', 'schedule_delete', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-16 09:02:08', '2026-03-16 09:02:08', '2', 0, NULL),
	(6, '9-99999', NULL, 'Trisha Anabeza', 'schedule_delete', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-16 09:02:12', '2026-03-16 09:02:12', '2', 0, NULL),
	(7, '9-99999', NULL, 'Trisha Anabeza', 'schedule_delete', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-16 09:02:15', '2026-03-16 09:02:15', '2', 0, NULL),
	(8, '23-1231213', NULL, 'Jonathan Jotojot', 'schedule_create', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-16 11:19:26', '2026-03-16 11:19:26', '2', 0, NULL),
	(9, NULL, NULL, 'bagyoo', 'event_delete', NULL, NULL, NULL, '2026-03-17 10:38:14', '2026-03-17 10:38:14', NULL, 0, NULL),
	(10, NULL, NULL, 'pahuway napud', 'event_delete', NULL, NULL, NULL, '2026-03-17 10:38:17', '2026-03-17 10:38:17', NULL, 0, NULL),
	(11, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-17 11:42:15', '2026-03-17 11:42:15', '3', 0, NULL),
	(12, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-17 11:42:27', '2026-03-17 11:42:27', '3', 0, NULL),
	(13, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-17 11:49:14', '2026-03-17 11:49:14', '3', 0, NULL),
	(14, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-17 12:01:16', '2026-03-17 12:01:16', '3', 0, NULL),
	(15, '9-99999', NULL, 'Trisha Anabeza', 'schedule_create', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-17 12:02:34', '2026-03-17 12:02:34', '3', 0, NULL),
	(16, '9-99999', NULL, 'Trisha Anabeza', 'scan', NULL, NULL, NULL, '2026-03-17 12:03:29', '2026-03-17 12:03:29', '3', 0, NULL),
	(17, '9-99999', NULL, 'Trisha Anabeza', 'scan', NULL, NULL, NULL, '2026-03-17 12:29:24', '2026-03-17 12:29:24', '3', 0, NULL),
	(18, '9-99999', NULL, 'Trisha Anabeza', 'scan', NULL, NULL, NULL, '2026-03-17 12:31:32', '2026-03-17 12:31:32', '3', 0, NULL),
	(19, '9-99999', NULL, 'Trisha Anabeza', 'scan', NULL, NULL, NULL, '2026-03-17 12:31:35', '2026-03-17 12:31:35', '3', 0, NULL),
	(20, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-17 12:36:43', '2026-03-17 12:36:43', '3', 0, NULL),
	(21, '9-99999', NULL, 'Trisha Anabeza', 'scan', NULL, NULL, NULL, '2026-03-17 12:37:56', '2026-03-17 12:37:56', '3', 0, NULL),
	(22, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-17 12:38:54', '2026-03-17 12:38:54', '3', 0, NULL),
	(23, '9-99999', NULL, 'Trisha Anabeza', 'scan', NULL, NULL, NULL, '2026-03-17 12:39:23', '2026-03-17 12:39:23', '3', 0, NULL),
	(24, NULL, NULL, 'Bagyoo nanamen', 'event_create', NULL, NULL, NULL, '2026-03-19 08:42:38', '2026-03-19 08:42:38', NULL, 0, NULL),
	(25, NULL, NULL, 'Bagyoo nanamen', 'event_delete', NULL, NULL, NULL, '2026-03-19 08:44:54', '2026-03-19 08:44:54', NULL, 0, NULL),
	(26, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 09:56:56', '2026-03-19 09:56:56', '3', 0, NULL),
	(27, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 10:33:53', '2026-03-19 10:33:53', '3', 0, NULL),
	(28, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 10:47:55', '2026-03-19 10:47:55', '3', 0, NULL),
	(29, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 10:51:41', '2026-03-19 10:51:41', '3', 0, NULL),
	(30, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 10:52:58', '2026-03-19 10:52:58', '3', 0, NULL),
	(31, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 10:58:16', '2026-03-19 10:58:16', '3', 0, NULL),
	(32, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 10:58:20', '2026-03-19 10:58:20', '3', 0, NULL),
	(33, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 10:59:51', '2026-03-19 10:59:51', '3', 0, NULL),
	(34, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 11:46:03', '2026-03-19 11:46:03', '3', 1, NULL),
	(35, '9-99999', NULL, 'Trisha Anabeza', 'scan', NULL, NULL, NULL, '2026-03-19 11:46:35', '2026-03-19 11:46:35', '3', 1, NULL),
	(36, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 11:53:16', '2026-03-19 11:53:16', '3', 0, NULL),
	(37, '9009999', NULL, 'Joshua Negre', 'schedule_create', NULL, 'Programming', NULL, '2026-03-19 11:58:05', '2026-03-19 11:58:05', '3', 0, NULL),
	(38, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 11:59:10', '2026-03-19 11:59:10', '3', 0, NULL),
	(39, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 11:59:15', '2026-03-19 11:59:15', '3', 0, NULL),
	(40, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 12:18:13', '2026-03-19 12:18:13', '3', 0, NULL),
	(41, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 12:18:19', '2026-03-19 12:18:19', '3', 0, NULL),
	(42, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 12:21:36', '2026-03-19 12:21:36', '3', 0, NULL),
	(43, '9009999', NULL, 'Joshua Negre', 'schedule_delete', NULL, 'Programming', NULL, '2026-03-19 12:29:57', '2026-03-19 12:29:57', '3', 0, NULL),
	(44, '9009999', NULL, 'Joshua Negre', 'schedule_delete', NULL, 'Programming', NULL, '2026-03-19 12:29:58', '2026-03-19 12:29:58', '3', 0, NULL),
	(45, '9-99999', NULL, 'Trisha Anabeza', 'schedule_delete', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 12:30:02', '2026-03-19 12:30:02', '3', 0, NULL),
	(46, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-19 13:00:24', '2026-03-19 13:00:24', '3', 0, NULL),
	(47, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:02:18', '2026-03-19 13:02:18', '3', 0, NULL),
	(48, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:05:26', '2026-03-19 13:05:26', '3', 0, NULL),
	(49, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:16:14', '2026-03-19 13:16:14', '3', 0, NULL),
	(50, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:18:40', '2026-03-19 13:18:40', '3', 0, NULL),
	(51, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:24:35', '2026-03-19 13:24:35', '3', 0, NULL),
	(52, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:27:25', '2026-03-19 13:27:25', '3', 0, NULL),
	(53, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Programming', NULL, '2026-03-19 13:34:49', '2026-03-19 13:34:49', '3', 0, NULL),
	(54, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:37:37', '2026-03-19 13:37:37', '3', 0, NULL),
	(55, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:37:42', '2026-03-19 13:37:42', '3', 0, NULL),
	(56, '9009999', NULL, 'Joshua Negre', 'schedule_create', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:40:38', '2026-03-19 13:40:38', '3', 0, NULL),
	(57, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:40:51', '2026-03-19 13:40:51', '3', 0, NULL),
	(58, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 13:40:56', '2026-03-19 13:40:56', '3', 0, NULL),
	(59, '9009999', NULL, 'Joshua Negre', 'schedule_create', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:42:57', '2026-03-19 13:42:57', NULL, 0, NULL),
	(60, '9009999', NULL, 'Joshua Negre', 'schedule_create', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:44:23', '2026-03-19 13:44:23', '3', 0, NULL),
	(61, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:46:10', '2026-03-19 13:46:10', '3', 0, NULL),
	(62, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:49:01', '2026-03-19 13:49:01', '3', 0, NULL),
	(63, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:50:06', '2026-03-19 13:50:06', '3', 0, NULL),
	(64, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:51:29', '2026-03-19 13:51:29', '3', 0, NULL),
	(65, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 13:53:31', '2026-03-19 13:53:31', '3', 1, NULL),
	(66, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 14:26:13', '2026-03-19 14:26:13', '3', 1, NULL),
	(67, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 14:28:02', '2026-03-19 14:28:02', '3', 1, NULL),
	(68, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 14:41:21', '2026-03-19 14:41:21', '3', 1, NULL),
	(69, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 14:42:43', '2026-03-19 14:42:43', '3', 1, NULL),
	(70, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-19 14:47:55', '2026-03-19 14:47:55', '3', 1, NULL),
	(71, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 22:23:52', '2026-03-19 22:23:52', '3', 1, NULL),
	(72, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 23:36:24', '2026-03-19 23:36:24', '3', 1, NULL),
	(73, '9009999', NULL, 'Joshua Negre', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-19 23:50:02', '2026-03-19 23:50:02', '3', 1, NULL),
	(74, '23-1231213', NULL, 'Jonathan Jotojot', 'schedule_create', NULL, 'Programming', NULL, '2026-03-19 23:54:17', '2026-03-19 23:54:17', '3', 0, NULL),
	(75, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, 'Object Oriented Programming (OOP)', NULL, '2026-03-20 00:38:22', '2026-03-20 00:38:22', '3', 1, NULL),
	(76, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, 'Programming', NULL, '2026-03-20 00:38:32', '2026-03-20 00:38:32', '3', 1, NULL),
	(77, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-20 00:38:44', '2026-03-20 00:38:44', '3', 1, NULL),
	(78, NULL, NULL, 'asdasd', 'event_create', NULL, NULL, NULL, '2026-03-20 01:06:36', '2026-03-20 01:06:36', NULL, 0, NULL),
	(79, NULL, NULL, 'asdasd', 'event_delete', NULL, NULL, NULL, '2026-03-20 01:19:36', '2026-03-20 01:19:36', NULL, 0, NULL),
	(80, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-20 02:14:36', '2026-03-20 02:14:36', '3', 1, NULL),
	(81, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-20 02:14:52', '2026-03-20 02:14:52', '3', 1, NULL),
	(82, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-20 02:23:48', '2026-03-20 02:23:48', '3', 1, NULL),
	(83, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-20 02:23:54', '2026-03-20 02:23:54', '3', 1, NULL),
	(84, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-20 02:24:10', '2026-03-20 02:24:10', '3', 1, NULL),
	(85, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-20 02:58:46', '2026-03-20 02:58:46', '3', 1, NULL),
	(86, NULL, NULL, 'adsasd', 'event_create', NULL, NULL, NULL, '2026-03-20 03:23:05', '2026-03-20 03:23:05', NULL, 0, NULL),
	(87, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-20 04:18:07', '2026-03-20 04:18:07', '3', 1, NULL),
	(88, '23-1231213', NULL, 'Jonathan Jotojot', 'scan', NULL, NULL, NULL, '2026-03-21 11:30:25', '2026-03-21 11:30:25', '3', 1, NULL),
	(89, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 11:35:15', '2026-03-21 11:35:15', '3', 1, NULL),
	(90, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 11:40:02', '2026-03-21 11:40:02', '3', 1, NULL),
	(91, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 11:41:17', '2026-03-21 11:41:17', '3', 1, NULL),
	(92, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 11:46:58', '2026-03-21 11:46:58', '3', 1, NULL),
	(93, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 11:47:28', '2026-03-21 11:47:28', '3', 1, NULL),
	(94, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 11:52:37', '2026-03-21 11:52:37', '3', 1, NULL),
	(95, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 11:55:46', '2026-03-21 11:55:46', '3', 1, NULL),
	(96, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 11:59:28', '2026-03-21 11:59:28', '3', 1, NULL),
	(97, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 11:59:31', '2026-03-21 11:59:31', '3', 1, NULL),
	(98, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:00:09', '2026-03-21 12:00:09', '3', 1, NULL),
	(99, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:00:32', '2026-03-21 12:00:32', '3', 1, NULL),
	(100, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:04:02', '2026-03-21 12:04:02', '3', 1, NULL),
	(101, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:04:22', '2026-03-21 12:04:22', '3', 1, NULL),
	(102, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:04:45', '2026-03-21 12:04:45', '3', 1, NULL),
	(103, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:08:37', '2026-03-21 12:08:37', '3', 1, NULL),
	(104, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:10:56', '2026-03-21 12:10:56', '3', 1, NULL),
	(105, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:13:42', '2026-03-21 12:13:42', '3', 1, NULL),
	(106, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:15:36', '2026-03-21 12:15:36', '3', 1, NULL),
	(107, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:19:53', '2026-03-21 12:19:53', '3', 1, NULL),
	(108, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:24:05', '2026-03-21 12:24:05', '3', 1, NULL),
	(109, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:25:30', '2026-03-21 12:25:30', '3', 1, NULL),
	(110, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:34:21', '2026-03-21 12:34:21', '3', 1, NULL),
	(111, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:34:25', '2026-03-21 12:34:25', '3', 1, NULL),
	(112, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:34:31', '2026-03-21 12:34:31', '3', 1, NULL),
	(113, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:35:43', '2026-03-21 12:35:43', '3', 1, NULL),
	(114, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:36:24', '2026-03-21 12:36:24', '3', 1, NULL),
	(115, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:36:31', '2026-03-21 12:36:31', '3', 1, NULL),
	(116, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:36:47', '2026-03-21 12:36:47', '3', 1, NULL),
	(117, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:37:03', '2026-03-21 12:37:03', '3', 1, NULL),
	(118, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:37:11', '2026-03-21 12:37:11', '3', 1, NULL),
	(119, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:44:06', '2026-03-21 12:44:06', '3', 1, NULL),
	(120, '9009999', NULL, 'Joshua Negre', 'scan', NULL, NULL, NULL, '2026-03-21 12:44:29', '2026-03-21 12:44:29', '3', 1, NULL),
	(121, '11-2223-333', NULL, 'Karlo Jay Libores', 'scan', NULL, NULL, NULL, '2026-03-21 12:44:55', '2026-03-21 12:44:55', '3', 1, NULL);

-- Dumping structure for table profscan_db.attendance_logs_db
CREATE TABLE IF NOT EXISTS `attendance_logs_db` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `instructor_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule_id` int DEFAULT NULL,
  `room` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `date` date DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Absent',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `day` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.attendance_logs_db: ~51 rows (approximately)
INSERT INTO `attendance_logs_db` (`id`, `instructor_id`, `schedule_id`, `room`, `time_in`, `time_out`, `date`, `status`, `created_at`, `updated_at`, `day`, `subject`, `code`) VALUES
	(1, '23-1231213', NULL, 'CL01 Scanner', '06:23:52', '08:00:00', '2026-03-20', 'Present', '2026-03-19 22:23:52', '2026-03-19 22:23:52', 'MWF', 'Object Oriented Programming (OOP)', 'IT-201'),
	(2, NULL, 13, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 06:53:22', NULL, NULL, NULL, NULL),
	(3, NULL, 12, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 06:57:35', NULL, NULL, NULL, NULL),
	(4, NULL, 26, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 07:00:31', NULL, NULL, NULL, NULL),
	(5, NULL, 13, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 07:04:39', NULL, NULL, NULL, NULL),
	(6, NULL, 13, NULL, NULL, '15:11:46', NULL, 'absent', '2026-03-20 07:10:40', NULL, NULL, NULL, NULL),
	(7, NULL, 12, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 07:19:36', NULL, NULL, NULL, NULL),
	(8, NULL, 13, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 07:20:48', NULL, NULL, NULL, NULL),
	(9, NULL, 12, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 07:34:20', NULL, NULL, NULL, NULL),
	(10, '9009999', NULL, 'CL01 Scanner', '07:36:24', '20:21:00', '2026-03-20', 'Present', '2026-03-19 23:36:24', '2026-03-19 23:36:24', 'MWF', 'Object Oriented Programming (OOP)', 'IT-201'),
	(11, NULL, 12, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 07:42:36', NULL, NULL, NULL, NULL),
	(12, NULL, 13, NULL, NULL, NULL, NULL, 'absent', '2026-03-20 07:46:04', NULL, NULL, NULL, NULL),
	(13, '9009999', NULL, 'CL01 Scanner', '07:50:02', '20:21:00', '2026-03-20', 'Present', '2026-03-19 23:50:02', '2026-03-19 23:50:02', 'MWF', 'Object Oriented Programming (OOP)', 'IT-201'),
	(14, '23-1231213', 29, 'CLO1 Scanner', NULL, '19:54:00', '2026-03-20', 'Absent', '2026-03-19 23:54:19', '2026-03-20 11:17:01', 'MWF', 'Programming', 'IT-101'),
	(15, '23-1231213', NULL, 'CL01 Scanner', '08:38:22', '08:00:00', '2026-03-20', 'Present', '2026-03-20 00:38:22', '2026-03-20 00:38:22', 'MWF', 'Object Oriented Programming (OOP)', 'IT-201'),
	(16, '23-1231213', NULL, 'CLO1 Scanner', '08:38:32', '19:54:00', '2026-03-20', 'Present', '2026-03-20 00:38:32', '2026-03-20 00:38:32', 'MWF', 'Programming', 'IT-101'),
	(17, '9009999', 26, 'CLO1 Scanner', NULL, '06:40:00', '2026-03-20', 'Excused', '2026-03-20 01:18:12', '2026-03-20 01:18:12', 'MWF', 'Object Oriented Programming (OOP)', 'IT-201'),
	(18, '9009999', 28, 'CLO1 Scanner', NULL, '14:44:00', '2026-03-20', 'Excused', '2026-03-20 01:18:12', '2026-03-20 01:18:12', 'MWF', 'Object Oriented Programming (OOP)', 'IT-201'),
	(19, '23-1231213', 22, 'TEST RM', NULL, '23:00:00', '2026-03-20', 'Excused', '2026-03-20 03:34:37', '2026-03-20 04:06:21', 'MWF', 'Friday Test Class', 'FRI01'),
	(20, '9-99999', 77, 'CL01 Scanner', NULL, '12:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:53', '2026-03-20 04:06:21', 'MWF', 'Philosophy', 'CAS-107'),
	(21, '345356-345345', 73, 'CL01 Scanner', NULL, '15:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:53', '2026-03-20 04:06:21', 'MWF', 'Anatomy and Physiology', 'CHM-113'),
	(22, '345356-345345', 72, 'CL01 Scanner', NULL, '14:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:53', '2026-03-20 04:06:21', 'MWF', 'Microbiology', 'CHM-112'),
	(23, '345356-345345', 71, 'CL01 Scanner', NULL, '10:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:53', '2026-03-20 04:06:21', 'MWF', 'Pharmacology', 'CHM-111'),
	(24, '345356-345345', 70, 'CL01 Scanner', NULL, '09:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:54', '2026-03-20 04:06:21', 'MWF', 'Health Science II', 'CHM-110'),
	(25, '345356-345345', 69, 'CL01 Scanner', NULL, '08:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:54', '2026-03-20 04:06:21', 'MWF', 'Health Science I', 'CHM-109'),
	(26, '23-1231213', 65, 'CL02 Scanner', NULL, '12:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:54', '2026-03-20 04:06:21', 'MWF', 'Physical Chemistry', 'CHM-105'),
	(27, '23-1231213', 64, 'CL02 Scanner', NULL, '11:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:54', '2026-03-20 04:06:21', 'MWF', 'Analytical Chemistry', 'CHM-104'),
	(28, '23-1231213', 63, 'CL02 Scanner', NULL, '10:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:54', '2026-03-20 04:06:21', 'MWF', 'Inorganic Chemistry', 'CHM-103'),
	(29, '23-1231213', 62, 'CL02 Scanner', NULL, '09:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:54', '2026-03-20 04:06:21', 'MWF', 'Organic Chemistry', 'CHM-102'),
	(30, '23-1231213', 61, 'CL02 Scanner', NULL, '08:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:55', '2026-03-20 04:06:21', 'MWF', 'General Chemistry', 'CHM-101'),
	(31, '11-2223-333', 57, 'CL01 Scanner', NULL, '14:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:55', '2026-03-20 04:06:21', 'MWF', 'Network Security', 'CS-104'),
	(32, '11-2223-333', 56, 'CL01 Scanner', NULL, '12:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:55', '2026-03-20 04:06:21', 'MWF', 'System Analysis', 'CS-103'),
	(33, '11-2223-333', 55, 'CL01 Scanner', NULL, '09:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:55', '2026-03-20 04:06:21', 'MWF', 'Algorithm Design', 'CS-102'),
	(34, '11-2223-333', 54, 'CL01 Scanner', NULL, '08:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:55', '2026-03-20 04:06:21', 'MWF', 'Computer Programming', 'CS-101'),
	(35, '23-123121', 51, 'CL02 Scanner', NULL, '15:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:55', '2026-03-20 04:06:21', 'MWF', 'Artificial Intelligence', 'IT-210'),
	(36, '23-123121', 50, 'CL02 Scanner', NULL, '14:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:56', '2026-03-20 04:06:21', 'MWF', 'Human Computer Interaction', 'IT-209'),
	(37, '23-123121', 49, 'CL02 Scanner', NULL, '12:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:56', '2026-03-20 04:06:21', 'MWF', 'Discrete Mathematics', 'IT-208'),
	(38, '23-123121', 48, 'CL02 Scanner', NULL, '11:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:56', '2026-03-20 04:06:21', 'MWF', 'Computer Networks', 'IT-207'),
	(39, '9009999', 45, 'CL01 Scanner', NULL, '11:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:56', '2026-03-20 04:06:21', 'MWF', 'Database Management', 'IT-204'),
	(40, '9009999', 44, 'CL01 Scanner', NULL, '10:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:56', '2026-03-20 04:06:21', 'MWF', 'Web Development', 'IT-203'),
	(41, '9009999', 43, 'CL01 Scanner', NULL, '09:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:56', '2026-03-20 04:06:21', 'MWF', 'Data Structures', 'IT-202'),
	(42, '9009999', 42, 'CL01 Scanner', NULL, '08:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:57', '2026-03-20 04:06:21', 'MWF', 'Object Oriented Programming', 'IT-201'),
	(43, '12-1231231-2', 38, 'CL02 Scanner', NULL, '10:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:57', '2026-03-20 04:06:21', 'MWF', 'Criminology', 'CCJ-103'),
	(44, '12-1231231-2', 37, 'CL02 Scanner', NULL, '09:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:57', '2026-03-20 04:06:21', 'MWF', 'Criminal Law II', 'CCJ-102'),
	(45, '12-1231231-2', 36, 'CL02 Scanner', NULL, '08:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:57', '2026-03-20 04:06:21', 'MWF', 'Criminal Law I', 'CCJ-101'),
	(46, '9-99999', 33, 'CL01 Scanner', NULL, '11:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:57', '2026-03-20 04:06:21', 'MWF', 'Social Science', 'CAS-104'),
	(47, '9-99999', 32, 'CL01 Scanner', NULL, '10:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:57', '2026-03-20 04:06:21', 'MWF', 'Natural Science', 'CAS-103'),
	(48, '9-99999', 31, 'CL01 Scanner', NULL, '09:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:58', '2026-03-20 04:06:21', 'MWF', 'Environmental Science', 'CAS-102'),
	(49, '9-99999', 30, 'CL01 Scanner', NULL, '08:00:00', '2026-03-20', 'Excused', '2026-03-20 03:54:58', '2026-03-20 04:06:21', 'MWF', 'General Biology', 'CAS-101'),
	(50, '9009999', 27, NULL, NULL, '11:42:00', '2026-03-20', 'Excused', '2026-03-20 03:54:58', '2026-03-20 04:06:21', 'MWF', 'Object Oriented Programming (OOP)', 'IT-201'),
	(51, '23-1231213', 20, 'LAB301', NULL, '10:30:00', '2026-03-20', 'Excused', '2026-03-20 03:54:59', '2026-03-20 04:06:21', 'MWF', 'Web Development', 'IT302');

-- Dumping structure for table profscan_db.cache
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.cache: ~58 rows (approximately)
INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
	('laravel-cache-0ggvvEvZwbqesizk', 'a:1:{s:11:"valid_until";i:1773993828;}', 1775201868),
	('laravel-cache-1AxxAk98oPP4TdTx', 'a:1:{s:11:"valid_until";i:1773777780;}', 1774984080),
	('laravel-cache-1FP1oGqWxMlnxvFW', 'a:1:{s:11:"valid_until";i:1774025247;}', 1775234847),
	('laravel-cache-1ugwgTtEBK0hropU', 'a:1:{s:11:"valid_until";i:1773777838;}', 1774987498),
	('laravel-cache-50DJAIp4QXYeohqw', 'a:1:{s:11:"valid_until";i:1773949577;}', 1775158877),
	('laravel-cache-8UssaDTeDuTgZlZE', 'a:1:{s:11:"valid_until";i:1774008401;}', 1775217821),
	('laravel-cache-92S23kfI056NqCVg', 'a:1:{s:11:"valid_until";i:1773956322;}', 1775165802),
	('laravel-cache-aJkuesqhp1sZt59x', 'a:1:{s:11:"valid_until";i:1773952173;}', 1775161173),
	('laravel-cache-aUryEX56jADz1cf7', 'a:1:{s:11:"valid_until";i:1773949756;}', 1775159296),
	('laravel-cache-BBOqJ99GvQTSkTN9', 'a:1:{s:11:"valid_until";i:1773954104;}', 1775163164),
	('laravel-cache-bNs7ekOcWgBUbSqC', 'a:1:{s:11:"valid_until";i:1773949156;}', 1775157916),
	('laravel-cache-btxO8aBV715H0J3y', 'a:1:{s:11:"valid_until";i:1773995823;}', 1775203503),
	('laravel-cache-BXcV2IdKQlSa5lmy', 'a:1:{s:11:"valid_until";i:1774025129;}', 1775234489),
	('laravel-cache-cesY1KWEIjwuE7Qs', 'a:1:{s:11:"valid_until";i:1774123404;}', 1775332884),
	('laravel-cache-CG75kRSYFh7eWMx7', 'a:1:{s:11:"valid_until";i:1773774332;}', 1774981532),
	('laravel-cache-ClpTPczudqHFP0sh', 'a:1:{s:11:"valid_until";i:1773689081;}', 1774898561),
	('laravel-cache-cZUq5KmhfbUhYl9Y', 'a:1:{s:11:"valid_until";i:1774124455;}', 1775333995),
	('laravel-cache-diMt8D5HavzYlkzu', 'a:1:{s:11:"valid_until";i:1773951153;}', 1775160033),
	('laravel-cache-DMXCBABwmWo28wfF', 'a:1:{s:11:"valid_until";i:1773951447;}', 1775160867),
	('laravel-cache-DRUSLgftZbKQX9w3', 'a:1:{s:11:"valid_until";i:1774005754;}', 1775212534),
	('laravel-cache-DYFFXtyzdG3Qw7ao', 'a:1:{s:11:"valid_until";i:1774024805;}', 1775233985),
	('laravel-cache-E0qqPPmF5o77vAGT', 'a:1:{s:11:"valid_until";i:1773998685;}', 1775207265),
	('laravel-cache-eQN8CXjIFgOBbSmX', 'a:1:{s:11:"valid_until";i:1773779350;}', 1774987510),
	('laravel-cache-Fq0zIQgMoYb8N4GQ', 'a:1:{s:11:"valid_until";i:1774024300;}', 1775232700),
	('laravel-cache-fzb16tdiQ6BFhZVY', 'a:1:{s:11:"valid_until";i:1773954635;}', 1775163815),
	('laravel-cache-G7fhtizHJTALs7OK', 'a:1:{s:11:"valid_until";i:1774116114;}', 1775325654),
	('laravel-cache-h9crF5U8QNJAVivr', 'a:1:{s:11:"valid_until";i:1773950316;}', 1775159436),
	('laravel-cache-H9s9v8XpObFrABff', 'a:1:{s:11:"valid_until";i:1774005812;}', 1775215472),
	('laravel-cache-hN0U1Z9isPeh3wkp', 'a:1:{s:11:"valid_until";i:1773988093;}', 1775197513),
	('laravel-cache-HQQxUnq4tWo9PEym', 'a:1:{s:11:"valid_until";i:1774011203;}', 1775218643),
	('laravel-cache-HXKpVbbLXd4o9CPW', 'a:1:{s:11:"valid_until";i:1773688790;}', 1774896410),
	('laravel-cache-I91Ty8jWtIz5woAE', 'a:1:{s:11:"valid_until";i:1774124295;}', 1775333115),
	('laravel-cache-IapsLDTBTSXjcPdE', 'a:1:{s:11:"valid_until";i:1774116266;}', 1775325806),
	('laravel-cache-ILrRFy1GtPmj68h0', 'a:1:{s:11:"valid_until";i:1774118492;}', 1775328092),
	('laravel-cache-kRbkyCsC76jybgwz', 'a:1:{s:11:"valid_until";i:1773686403;}', 1774894803),
	('laravel-cache-KRD9dp64Ol5JiTta', 'a:1:{s:11:"valid_until";i:1774026970;}', 1775234950),
	('laravel-cache-MmT2WFIInffrNBSf', 'a:1:{s:11:"valid_until";i:1773953080;}', 1775161900),
	('laravel-cache-mwqxHJTMPxc3tJf8', 'a:1:{s:11:"valid_until";i:1773686729;}', 1774896089),
	('laravel-cache-nE12ZFLPHP9GAhN5', 'a:1:{s:11:"valid_until";i:1773960802;}', 1775169802),
	('laravel-cache-nuqY9vCFDBdGGKu9', 'a:1:{s:11:"valid_until";i:1774008959;}', 1775218079),
	('laravel-cache-nVEzdGlAibq1hYoo', 'a:1:{s:11:"valid_until";i:1773954954;}', 1775164314),
	('laravel-cache-NzkgJz0HRcGVJIaX', 'a:1:{s:11:"valid_until";i:1774005842;}', 1775215502),
	('laravel-cache-p2YjeyfktggCTY9a', 'a:1:{s:11:"valid_until";i:1773952207;}', 1775161867),
	('laravel-cache-paBg1b8NmNjOwUBA', 'a:1:{s:11:"valid_until";i:1773997535;}', 1775205695),
	('laravel-cache-pCoPhfUAigMggFnZ', 'a:1:{s:11:"valid_until";i:1773779513;}', 1774989053),
	('laravel-cache-Pe1ZlQWN3C8393L7', 'a:1:{s:11:"valid_until";i:1773780002;}', 1774989662),
	('laravel-cache-s2AYUhPbFRS2nBgT', 'a:1:{s:11:"valid_until";i:1774121654;}', 1775329634),
	('laravel-cache-SYDYO22QzoXKGpIc', 'a:1:{s:11:"valid_until";i:1773948217;}', 1775156437),
	('laravel-cache-V4ThbZHno3kaKAi1', 'a:1:{s:11:"valid_until";i:1773688857;}', 1774898517),
	('laravel-cache-vGfqTMNskDxGpejp', 'a:1:{s:11:"valid_until";i:1773953118;}', 1775162778),
	('laravel-cache-wc8OQ8LNSSMpnX8i', 'a:1:{s:11:"valid_until";i:1773771656;}', 1774979816),
	('laravel-cache-WHTs2ecCiusH7N8F', 'a:1:{s:11:"valid_until";i:1774121742;}', 1775331402),
	('laravel-cache-WMIeFZZf8EHUmoA1', 'a:1:{s:11:"valid_until";i:1773995989;}', 1775205589),
	('laravel-cache-wv2fNX8AsJ9Tnuc8', 'a:1:{s:11:"valid_until";i:1773771842;}', 1774981382),
	('laravel-cache-XSPeVUDk4pbd3puL', 'a:1:{s:11:"valid_until";i:1774119913;}', 1775328193),
	('laravel-cache-Xv92UEJ1EDT73LPJ', 'a:1:{s:11:"valid_until";i:1774118417;}', 1775325977),
	('laravel-cache-YLCo47i61WFN0bhi', 'a:1:{s:11:"valid_until";i:1774125881;}', 1775335061),
	('laravel-cache-ymjAlnUf834tRQDB', 'a:1:{s:11:"valid_until";i:1773953484;}', 1775162844);

-- Dumping structure for table profscan_db.cache_locks
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.cache_locks: ~0 rows (approximately)

-- Dumping structure for table profscan_db.departments
CREATE TABLE IF NOT EXISTS `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `degree_program` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.departments: ~2 rows (approximately)
INSERT INTO `departments` (`id`, `degree_program`, `college`, `created_at`, `updated_at`) VALUES
	(1, 'BS Information Technology', 'College of Computer Strudies (CCS)', '2026-03-16 06:53:18', '2026-03-16 06:53:18'),
	(2, 'BS Office Administration', 'College of Office Administration', '2026-03-16 06:57:55', '2026-03-16 06:57:55');

-- Dumping structure for table profscan_db.devices
CREATE TABLE IF NOT EXISTS `devices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pairing_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chip_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mac_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wifi_ssid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wifi_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `server_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scan_cooldown` int NOT NULL DEFAULT '3000',
  `paired` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'offline',
  `last_seen` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `devices_pairing_token_unique` (`pairing_token`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.devices: ~1 rows (approximately)
INSERT INTO `devices` (`id`, `name`, `pairing_token`, `chip_id`, `mac_address`, `wifi_ssid`, `wifi_password`, `server_url`, `scan_cooldown`, `paired`, `status`, `last_seen`, `created_at`, `updated_at`) VALUES
	(3, 'CLO1 Scanner', 'tok_n4xOgvbZz8yy6PgkuPZYPQGcV6JbqBkI', '840ff0a4', 'A4:F0:0F:84:1D:CC', 'EL_Guapo_2G', 'ElGuapoAdmin', 'http://192.168.0.101:8000/api/scan', 5000, 1, 'offline', '2026-03-21 12:45:12', '2026-03-17 10:31:26', '2026-03-21 22:50:10');

-- Dumping structure for table profscan_db.events
CREATE TABLE IF NOT EXISTS `events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_ends` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start` time NOT NULL,
  `ends` time NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.events: ~2 rows (approximately)
INSERT INTO `events` (`id`, `title`, `description`, `date`, `date_ends`, `location`, `type`, `status`, `start`, `ends`, `created_at`, `updated_at`) VALUES
	(4, 'asdad', 'oiaskjdca', '2026-03-01', '2026-03-04', 'adad', 'Administrative', 'completed', '08:00:00', '08:01:00', '2026-02-25 05:54:21', '2026-02-25 05:54:21'),
	(6, 'asdasd', 'asdasdasd', '2026-10-20', '2027-10-20', 'asd', 'Administrative', 'upcoming', '02:32:00', '00:32:00', '2026-02-25 06:04:39', '2026-02-25 06:04:39'),
	(21, 'adsasd', 'adssa', '2026-03-20', '2026-03-23', 'asd', 'Academic', 'Ongoing', '19:22:00', '19:22:00', '2026-03-20 03:23:05', '2026-03-20 03:23:05');

-- Dumping structure for table profscan_db.failed_jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.failed_jobs: ~0 rows (approximately)

-- Dumping structure for table profscan_db.job_batches
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.job_batches: ~0 rows (approximately)

-- Dumping structure for table profscan_db.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.jobs: ~0 rows (approximately)

-- Dumping structure for table profscan_db.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.migrations: ~38 rows (approximately)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '0001_01_01_000000_create_users_table', 1),
	(2, '0001_01_01_000001_create_cache_table', 1),
	(3, '0001_01_01_000002_create_jobs_table', 1),
	(4, '2025_08_26_100418_add_two_factor_columns_to_users_table', 1),
	(5, '2026_01_28_160835_create_user_info', 1),
	(6, '2026_01_29_163227_add_columns_to_user_info_table', 1),
	(7, '2026_01_29_163857_add_columns_to_user_infos_table', 1),
	(8, '2026_01_29_165441_rename_column_fk_id_to_inst_id_in_user_infos', 1),
	(9, '2026_01_29_173930_add_qr_to_user_infos_table', 1),
	(10, '2026_02_16_180441_add_photo_url_to_user_infos_table', 2),
	(11, '2026_02_17_164859_add_department_column', 3),
	(12, '2026_02_17_171817_add_birth_date_column', 4),
	(13, '2026_02_24_183846_create_users_db', 5),
	(14, '2026_02_24_185203_create_users', 6),
	(15, '2026_02_25_063855_create_attendance_logs_db', 7),
	(16, '2026_02_25_070032_add_day', 8),
	(17, '2026_02_25_111728_create_events', 9),
	(18, '2026_02_27_174125_create_schedule_table', 10),
	(19, '2026_02_27_175128_add_status', 11),
	(20, '2026_02_28_063552_add_end_time_cloumn', 12),
	(21, '2026_03_02_174913_add_subject_code-table', 13),
	(22, '2026_03_03_164016_change_qr_payload_column_type', 14),
	(23, '2026_03_11_060734_add_scan_fields_to_users_table', 15),
	(24, '2026_03_11_061749_add_scan_fieldss_to_users_table', 16),
	(25, '2026_03_16_051409_create_device_table', 17),
	(26, '2026_03_16_081458_make_employee_id_nullable_on_users_table', 18),
	(27, '2026_03_16_081830_add_staff_id_to_users_table', 19),
	(28, '2026_03_16_091454_add_device_id_to_schedule_models_table', 20),
	(29, '2026_03_16_092549_add_room_and_device_id_to_schedule_table', 21),
	(30, '2026_03_16_104850_create_subject_table', 21),
	(31, '2026_03_16_133312_create_department_table', 22),
	(32, '2026_03_16_154535_create_scan_activity_table', 23),
	(33, '2026_03_16_160524_add_device_id', 24),
	(34, '2026_03_19_190800_add_success_table', 25),
	(35, '2026_03_19_195144_change_scan_status_default_in_users_table', 26),
	(36, '2026_03_19_203100_add_attendance', 27),
	(37, '2026_03_19_205606_add_scanned_at_to_schedule_table', 28),
	(38, '2026_03_19_222100_add_subject', 29),
	(39, '2026_03_19_222930_add__subject_code', 30);

-- Dumping structure for table profscan_db.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.password_reset_tokens: ~0 rows (approximately)

-- Dumping structure for event profscan_db.reset_scan_status_users
DELIMITER //
CREATE EVENT `reset_scan_status_users` ON SCHEDULE EVERY 1 DAY STARTS '2026-03-21 00:00:00' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE users
  SET scan_status = 'unscanned'//
DELIMITER ;

-- Dumping structure for table profscan_db.schedule
CREATE TABLE IF NOT EXISTS `schedule` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `instructor_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `time` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `day` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` time NOT NULL,
  `subject_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_id` bigint unsigned DEFAULT NULL,
  `attendance` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Absent',
  `scanned_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `schedule_device_id_foreign` (`device_id`),
  CONSTRAINT `schedule_device_id_foreign` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.schedule: ~61 rows (approximately)
INSERT INTO `schedule` (`id`, `instructor_id`, `name`, `subject`, `time`, `day`, `created_at`, `updated_at`, `status`, `end_time`, `subject_code`, `room`, `device_id`, `attendance`, `scanned_at`) VALUES
	(12, '9009999', 'Joshua Negre', 'Object Oriented Programming (OOP)', '19:21', 'MWF', '2026-03-16 02:21:08', '2026-03-20 08:38:49', 'Upcoming', '20:21:00', 'IT-201', 'CL01 Scanner', 3, 'Present', NULL),
	(13, '9-99999', 'Trisha Anabeza', 'Object Oriented Programming (OOP)', '13:30', 'TTH', '2026-03-16 08:53:41', '2026-03-20 08:36:49', 'Upcoming', '15:00:00', 'IT-201', 'CL01 Scanner', 3, 'Absent', NULL),
	(18, '23-1231213', 'Jonathan Jotojot', 'Object Oriented Programming (OOP)', '07:00', 'MWF', '2026-03-16 11:19:26', '2026-03-20 08:38:49', 'Upcoming', '08:00:00', 'IT-201', 'CL01 Scanner', 3, 'Present', NULL),
	(20, '23-1231213', 'Jonathan Jotojot', 'Web Development', '09:00:00', 'MWF', '2026-03-19 17:43:48', '2026-03-20 08:36:49', 'Upcoming', '10:30:00', 'IT302', 'LAB301', 3, 'Absent', NULL),
	(21, '23-1231213', 'Jonathan Jotojot', 'Database Systems', '13:00:00', 'TTH', '2026-03-19 17:43:48', '2026-03-19 17:43:48', 'Upcoming', '14:30:00', 'IT205', 'RM204', 3, 'Absent', NULL),
	(22, '23-1231213', 'Jonathan Jotojot', 'Friday Test Class', '22:00:00', 'MWF', '2026-03-19 18:45:47', '2026-03-20 08:36:49', 'Upcoming', '23:00:00', 'FRI01', 'TEST RM', 3, 'Absent', NULL),
	(23, '9009999', 'Joshua Negre', 'Programming', '03:55', 'MWF', '2026-03-19 11:55:25', '2026-03-20 08:38:49', 'Upcoming', '10:55:00', 'IT-101', 'CLO1 Scanner', 3, 'Present', NULL),
	(26, '9009999', 'Joshua Negre', 'Object Oriented Programming (OOP)', '05:40', 'MWF', '2026-03-19 13:40:38', '2026-03-20 08:36:49', 'Upcoming', '06:40:00', 'IT-201', 'CLO1 Scanner', 3, 'Absent', NULL),
	(27, '9009999', 'Joshua Negre', 'Object Oriented Programming (OOP)', '05:42', 'MWF', '2026-03-19 13:42:57', '2026-03-20 08:36:49', 'Upcoming', '11:42:00', 'IT-201', NULL, 3, 'Absent', NULL),
	(28, '9009999', 'Joshua Negre', 'Object Oriented Programming (OOP)', '05:44', 'MWF', '2026-03-19 13:44:23', '2026-03-20 08:36:49', 'Upcoming', '14:44:00', 'IT-201', 'CLO1 Scanner', 3, 'Absent', NULL),
	(29, '23-1231213', 'Jonathan Jotojot', 'Programming', '15:54', 'MWF', NULL, '2026-03-20 09:10:10', 'Absent', '19:54:00', 'IT-101', 'CLO1 Scanner', 3, 'Absent', NULL),
	(30, '9-99999', 'Trisha Anabeza', 'General Biology', '07:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '08:00:00', 'CAS-101', 'CL01 Scanner', 3, 'Absent', NULL),
	(31, '9-99999', 'Trisha Anabeza', 'Environmental Science', '08:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '09:00:00', 'CAS-102', 'CL01 Scanner', 3, 'Absent', NULL),
	(32, '9-99999', 'Trisha Anabeza', 'Natural Science', '09:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '10:00:00', 'CAS-103', 'CL01 Scanner', 3, 'Absent', NULL),
	(33, '9-99999', 'Trisha Anabeza', 'Social Science', '10:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '11:00:00', 'CAS-104', 'CL01 Scanner', 3, 'Absent', NULL),
	(34, '9-99999', 'Trisha Anabeza', 'Research Methods', '07:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '08:30:00', 'CAS-105', 'CL01 Scanner', 3, 'Absent', NULL),
	(35, '9-99999', 'Trisha Anabeza', 'Statistics', '08:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '10:00:00', 'CAS-106', 'CL01 Scanner', 3, 'Absent', NULL),
	(36, '12-1231231-2', 'Trinidad Bohol', 'Criminal Law I', '07:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '08:00:00', 'CCJ-101', 'CL02 Scanner', 3, 'Absent', NULL),
	(37, '12-1231231-2', 'Trinidad Bohol', 'Criminal Law II', '08:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '09:00:00', 'CCJ-102', 'CL02 Scanner', 3, 'Absent', NULL),
	(38, '12-1231231-2', 'Trinidad Bohol', 'Criminology', '09:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '10:00:00', 'CCJ-103', 'CL02 Scanner', 3, 'Absent', NULL),
	(39, '12-1231231-2', 'Trinidad Bohol', 'Forensic Science', '07:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '08:30:00', 'CCJ-104', 'CL02 Scanner', 3, 'Absent', NULL),
	(40, '12-1231231-2', 'Trinidad Bohol', 'Crime Prevention', '08:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '10:00:00', 'CCJ-105', 'CL02 Scanner', 3, 'Absent', NULL),
	(41, '12-1231231-2', 'Trinidad Bohol', 'Juvenile Delinquency', '10:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '11:30:00', 'CCJ-106', 'CL02 Scanner', 3, 'Absent', NULL),
	(42, '9009999', 'Joshua Negre', 'Object Oriented Programming', '07:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '08:00:00', 'IT-201', 'CL01 Scanner', 3, 'Absent', NULL),
	(43, '9009999', 'Joshua Negre', 'Data Structures', '08:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '09:00:00', 'IT-202', 'CL01 Scanner', 3, 'Absent', NULL),
	(44, '9009999', 'Joshua Negre', 'Web Development', '09:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '10:00:00', 'IT-203', 'CL01 Scanner', 3, 'Absent', NULL),
	(45, '9009999', 'Joshua Negre', 'Database Management', '10:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '11:00:00', 'IT-204', 'CL01 Scanner', 3, 'Absent', NULL),
	(46, '9009999', 'Joshua Negre', 'Software Engineering', '07:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '08:30:00', 'IT-205', 'CL01 Scanner', 3, 'Absent', NULL),
	(47, '9009999', 'Joshua Negre', 'Operating Systems', '08:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '10:00:00', 'IT-206', 'CL01 Scanner', 3, 'Absent', NULL),
	(48, '23-123121', 'Wawang Negre', 'Computer Networks', '10:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '11:00:00', 'IT-207', 'CL02 Scanner', 3, 'Absent', NULL),
	(49, '23-123121', 'Wawang Negre', 'Discrete Mathematics', '11:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '12:00:00', 'IT-208', 'CL02 Scanner', 3, 'Absent', NULL),
	(50, '23-123121', 'Wawang Negre', 'Human Computer Interaction', '13:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '14:00:00', 'IT-209', 'CL02 Scanner', 3, 'Absent', NULL),
	(51, '23-123121', 'Wawang Negre', 'Artificial Intelligence', '14:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '15:00:00', 'IT-210', 'CL02 Scanner', 3, 'Absent', NULL),
	(52, '23-123121', 'Wawang Negre', 'Machine Learning', '10:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '11:30:00', 'IT-211', 'CL02 Scanner', 3, 'Absent', NULL),
	(53, '23-123121', 'Wawang Negre', 'Mobile Development', '11:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '13:00:00', 'IT-212', 'CL02 Scanner', 3, 'Absent', NULL),
	(54, '11-2223-333', 'Karlo Jay Libores', 'Computer Programming', '07:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '08:00:00', 'CS-101', 'CL01 Scanner', 3, 'Absent', NULL),
	(55, '11-2223-333', 'Karlo Jay Libores', 'Algorithm Design', '08:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '09:00:00', 'CS-102', 'CL01 Scanner', 3, 'Absent', NULL),
	(56, '11-2223-333', 'Karlo Jay Libores', 'System Analysis', '11:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '12:00:00', 'CS-103', 'CL01 Scanner', 3, 'Absent', NULL),
	(57, '11-2223-333', 'Karlo Jay Libores', 'Network Security', '13:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '14:00:00', 'CS-104', 'CL01 Scanner', 3, 'Absent', NULL),
	(58, '11-2223-333', 'Karlo Jay Libores', 'Cloud Computing', '07:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '08:30:00', 'CS-105', 'CL01 Scanner', 3, 'Absent', NULL),
	(59, '11-2223-333', 'Karlo Jay Libores', 'Cybersecurity', '08:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '10:00:00', 'CS-106', 'CL01 Scanner', 3, 'Absent', NULL),
	(60, '11-2223-333', 'Karlo Jay Libores', 'IT Project Management', '13:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '14:30:00', 'CS-107', 'CL01 Scanner', 3, 'Absent', NULL),
	(61, '23-1231213', 'Jonathan Jotojot', 'General Chemistry', '07:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '08:00:00', 'CHM-101', 'CL02 Scanner', 3, 'Absent', NULL),
	(62, '23-1231213', 'Jonathan Jotojot', 'Organic Chemistry', '08:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '09:00:00', 'CHM-102', 'CL02 Scanner', 3, 'Absent', NULL),
	(63, '23-1231213', 'Jonathan Jotojot', 'Inorganic Chemistry', '09:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '10:00:00', 'CHM-103', 'CL02 Scanner', 3, 'Absent', NULL),
	(64, '23-1231213', 'Jonathan Jotojot', 'Analytical Chemistry', '10:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '11:00:00', 'CHM-104', 'CL02 Scanner', 3, 'Absent', NULL),
	(65, '23-1231213', 'Jonathan Jotojot', 'Physical Chemistry', '11:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '12:00:00', 'CHM-105', 'CL02 Scanner', 3, 'Absent', NULL),
	(66, '23-1231213', 'Jonathan Jotojot', 'Biochemistry', '07:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '08:30:00', 'CHM-106', 'CL02 Scanner', 3, 'Absent', NULL),
	(67, '23-1231213', 'Jonathan Jotojot', 'Industrial Chemistry', '08:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '10:00:00', 'CHM-107', 'CL02 Scanner', 3, 'Absent', NULL),
	(68, '23-1231213', 'Jonathan Jotojot', 'Environmental Chemistry', '10:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '11:30:00', 'CHM-108', 'CL02 Scanner', 3, 'Absent', NULL),
	(69, '345356-345345', 'Ryan Jansin', 'Health Science I', '07:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '08:00:00', 'CHM-109', 'CL01 Scanner', 3, 'Absent', NULL),
	(70, '345356-345345', 'Ryan Jansin', 'Health Science II', '08:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '09:00:00', 'CHM-110', 'CL01 Scanner', 3, 'Absent', NULL),
	(71, '345356-345345', 'Ryan Jansin', 'Pharmacology', '09:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '10:00:00', 'CHM-111', 'CL01 Scanner', 3, 'Absent', NULL),
	(72, '345356-345345', 'Ryan Jansin', 'Microbiology', '13:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '14:00:00', 'CHM-112', 'CL01 Scanner', 3, 'Absent', NULL),
	(73, '345356-345345', 'Ryan Jansin', 'Anatomy and Physiology', '14:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '15:00:00', 'CHM-113', 'CL01 Scanner', 3, 'Absent', NULL),
	(74, '345356-345345', 'Ryan Jansin', 'Medical Terminology', '07:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '08:30:00', 'CHM-114', 'CL02 Scanner', 3, 'Absent', NULL),
	(75, '345356-345345', 'Ryan Jansin', 'Clinical Chemistry', '08:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '10:00:00', 'CHM-115', 'CL02 Scanner', 3, 'Absent', NULL),
	(76, '345356-345345', 'Ryan Jansin', 'Pathology', '11:30', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '13:00:00', 'CHM-116', 'CL02 Scanner', 3, 'Absent', NULL),
	(77, '9-99999', 'Trisha Anabeza', 'Philosophy', '11:00', 'MWF', '2026-03-20 11:40:31', '2026-03-20 08:36:49', 'Upcoming', '12:00:00', 'CAS-107', 'CL01 Scanner', 3, 'Absent', NULL),
	(78, '12-1231231-2', 'Trinidad Bohol', 'Legal Medicine', '13:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '14:30:00', 'CCJ-107', 'CL02 Scanner', 3, 'Absent', NULL),
	(79, '9009999', 'Joshua Negre', 'Capstone Project', '13:00', 'TTH', '2026-03-20 11:40:31', '2026-03-20 11:40:31', 'Upcoming', '14:30:00', 'IT-213', 'CL01 Scanner', 3, 'Absent', NULL);

-- Dumping structure for table profscan_db.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.sessions: ~19 rows (approximately)
INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
	('05Kzfu1PHgRtoW28rHrN7AMblYSfBqn72BYvipsE', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiU2dOVkhEbjJkTXFSYlhWMHhvUlhjc0xKZHJvRTRnc3c4ZHpBbWs0TCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296649),
	('aEo0nbLTAgPjeqTFvooxfQkAVMqsubPwBDRQC1MW', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiTmxVSG1nV0ZzSjF4Z1ROWUE0VmhYQlVjU2F6Z0JXVGpzZlFWYnRHVyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296656),
	('CisKgEuPls0E42YC0zGshv6SbRCsy0nfttVhnXjM', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicUxTQUtNUGpuN2xaVnc2RzNCaHNFTDBrSXNzTnBFTnlHZVNoVWxYeiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296486),
	('cZS1mQNCMi6cRQ4ARQISN0EJsdhHBJ2x1W7vSUbv', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiT05DN3VlWTY1Mzk0djhpUFhwVnpZM2pOUHpjcFc2V1VPWXNoRHE3RCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296629),
	('DR7dRMyvG8laAhuQZB8AjMDedxbNdcZYdNnlaJaz', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoieFU0NHBLU3gyRzJrYXhnVENQNXJPdGxPbEJTNjdZeEdrV0FuajhaRyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296628),
	('gVSDHWuqSjDS2zBTWW8mHhCXnuTpxQIrsMH60cCG', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUWlVRmZuSmxtV29ZTTVyWEdrUmVRMW5MbU9rdTd3YVlrclVuSDB4dCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772472625),
	('IbdZuclpAvorsgrepwI5DfKztIkf6Xt1Yy1GKlAw', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSjh2aEw5TjRraGQ3YlVWM1V5aThLbnVLMXRmMEloOTNTaEc2cE1CbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296629),
	('IGz7nWLM1pFDqJfLAxukXdPjAaDt4VBfCQJUXnNa', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiV2tDUExNcW9kZjh4d3ZCWUlSeVQxbEdkYTRobUVpTXZ4UENmOVRabCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296628),
	('ijqB80LfD9E9qnm48AGE3Y2spNX2yuPi3CC4pABC', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoid3RVbDl6eUtiOWpZQzNSU2ZlNkR0ZXJQM1l1YVZNdVlUd05VclhnOCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296656),
	('kyqzQwN5KpAEs58kgSthWkrZkEdktDEcDSwxzmau', 3, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiM0QwaXc2SXJDbTJ4Rm9wVzhXR0p3SXdVV3o0SzBMV3l4ZmdoT2lzVSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDM6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9zdXBlci1hZG1pbi1kYXNoYm9hcmQiO3M6NToicm91dGUiO3M6MjE6InN1cGVyLWFkbWluLmRhc2hib2FyZCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjM7fQ==', 1772292632),
	('L6LTVGC5VfVv59VZmh9JnYXCWbGPs5E0SyRayMga', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUDZ5eUFkcXZCM2t6Z3lFU3lubURFRENwZFBoZG1oaUlreEhIU084NiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772297998),
	('LIfZc70sosFtPLRZyfSYGW60dHW2F6eMjLQW5CLv', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiMlNCQmthdDY4OHNrc1ZnOERtV015SGgycEc0RVo2dFJjN3hJRVpsbSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296649),
	('mGo8JBgBN6mmPxGzRr3ESGFKJmg8KxwXLnqMYpQB', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVjdHamszejJVUnI0UEZRN0p1ZTJMMWVmcXFSOFhKQ3BqQ2czRk9RWiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296637),
	('ORz1c0Z0vyo1hNOPnQFI8AhFOqUZUDF2d9ZMC2KZ', 3, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiU0U2SWpobTdBNG96ZmVWNExMaUxmSElxZHdLNkRFOUdkcm1qQjNpeCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NDM6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9zdXBlci1hZG1pbi1kYXNoYm9hcmQiO3M6NToicm91dGUiO3M6MjE6InN1cGVyLWFkbWluLmRhc2hib2FyZCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjM7fQ==', 1772262780),
	('oU9bGimP4LHECPwUBhuwAzkg5GlVcY1V4e2Ea8tu', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiREZPSkdjTTJ5dnhibWZnaXBuWmpxVmlLSW1yOVZtM3FQUmIweXJxMCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296466),
	('pHzl8mPsLwn2lUv6tivfMbiNDOma6pmuwuUjvET9', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVHVKenUza0MwSFIxRU80S21qdlZTdzg1ZW9PT0dGZGxUd2RnMnpiSCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296466),
	('RmZn9FsAFgLtvSkD3Pu9KUB75RBfze9JZNAHpMn0', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiTjFpU21kVWUwbkx6anhqbjJUT09TMjdkRHpKZ3BpUnhlUjFOUzc1dSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296485),
	('sl9lTGLWBBR9KziYjBXxaiKHBGXKh5FC3OtCY2Cs', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicnVNbjlha2d2ak9jbGFUT0hNSkhheHNyYkloVENmZnRqOWtPMkFQSSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296466),
	('TK8erkZ8PuVwkHHcR1z1RhPFll1Og7vEnMH2tFmZ', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibTNiNlpZQUxRTVhKa1dod1plVWd6VmxySDlWZFEycm5MTkhyc3FNdiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296629),
	('XxDrpgiyvzRRpu0rGqBz22eRRj1lukRmEfN1wjRp', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVjdnd0tjNXh4Y0ZEMkROcmczdnprNkI0RU5YSTQ3YXpHajA2ZzExVCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772340357),
	('yOpuarmGxOcE3CfvPVBIYpN9oiaf1LFl0CDNFnpU', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNklyYTM4OEs4eUFDV1d5WFBuZ2xXeXkwd2VCaWoxSEFvMXc3RXlSRCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzA6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hcGkvdGVzdCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772296466);

-- Dumping structure for table profscan_db.subject
CREATE TABLE IF NOT EXISTS `subject` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.subject: ~2 rows (approximately)
INSERT INTO `subject` (`id`, `subject_code`, `subject`, `department`, `created_at`, `updated_at`) VALUES
	(1, 'IT-101', 'Programming', 'CCS', '2026-03-16 04:28:31', '2026-03-16 04:28:31'),
	(2, 'IT-201', 'Object Oriented Programming (OOP)', 'CCS', '2026-03-16 04:28:31', '2026-03-16 04:28:31');

-- Dumping structure for table profscan_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructor_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_payload` longtext COLLATE utf8mb4_unicode_ci,
  `profile_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'instructor',
  `contact_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialization` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `scan_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unscanned',
  `last_scanned_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_instructor_id_unique` (`instructor_id`),
  UNIQUE KEY `users_staff_id_unique` (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table profscan_db.users: ~9 rows (approximately)
INSERT INTO `users` (`id`, `staff_id`, `instructor_id`, `email`, `name`, `password`, `address`, `qr_payload`, `profile_url`, `role`, `contact_no`, `birth_date`, `gender`, `department`, `specialization`, `age`, `status`, `scan_status`, `last_scanned_at`, `email_verified_at`, `remember_token`, `created_at`, `updated_at`) VALUES
	(3, NULL, '999-9999', 'carl@gmail.com', 'Carl Vey Sente', '$2y$12$43dgs8yeOqSVDTxm3lzd8utllcyU7rOwuFjF3KGgHZ4HYRen4PtsW', NULL, NULL, 'admins/6rBe6qx6ExBsqoQAeereDVKcTm9GCEXyxM1XvJfy.jpg', 'admin', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 'unscanned', NULL, NULL, NULL, '2026-02-24 11:24:21', '2026-03-05 09:31:51'),
	(14, NULL, '9-99999', 'trish@gmail.com', 'Trisha Anabeza', '$2y$12$oXz2OLgaGFNdTqpAomxYqur8wW4GqAod0QgOTyg0vZ664RfZmZOyW', NULL, NULL, 'instructors/2iZ4ZXlDBTbodF1FWRxsN3Ov3x61tWa8v6969d4F.jpg', 'instructor', NULL, NULL, NULL, 'CAS', 'English', NULL, 'Active', 'unscanned', '2026-03-19 11:46:35', NULL, NULL, '2026-03-01 23:13:35', '2026-03-19 11:46:35'),
	(19, NULL, '12-1231231-2', 'trinidad@gmail.com', 'Trinidad Bohol', '$2y$12$Z1y/ZprPddbsv7tW0LAqwex4Y56/t53My/ckiuFb6vccKPmdn0bLO', NULL, NULL, 'instructors/3hiWJDvC70ub2Jd29yNDbv9ZFZBr8nprp6cgfqe4.png', 'instructor', NULL, NULL, NULL, 'CCJ', 'trinidad', NULL, 'Inactive', 'unscanned', NULL, NULL, NULL, '2026-03-01 23:32:37', '2026-03-04 08:32:37'),
	(20, NULL, '9009999', 'jwangardz@gmail.com', 'Joshua Negre', '$2y$12$6hPo6cTxY9rZzptIb.Dpcuk.Fr4rgnQKWKS2mh37nNOAIh9DyP/ke', NULL, NULL, 'instructors/L21atZRWCX62BCQAUJIhwGmwPTCfJU6pxchioitI.jpg', 'instructor', NULL, NULL, NULL, 'CCS', 'Parkour', NULL, 'Active', 'scanned', '2026-03-21 12:44:29', NULL, NULL, '2026-03-02 09:28:01', '2026-03-21 12:44:29'),
	(21, NULL, '23-123121', 'wawang@gmail.com', 'Wawang Negre', '$2y$12$QEn8ABUxQLC9NvDGYdO0revjWNupKjQzZJo.NcXuatxk9FD2tPzcW', NULL, 'data:image/png;base64,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.jpg', 'instructor', NULL, NULL, NULL, 'CCS', 'Pa Pogi', NULL, 'Active', 'unscanned', NULL, NULL, NULL, '2026-03-03 08:42:47', '2026-03-03 08:42:47'),
	(22, NULL, '11-2223-333', 'karlo@gmail.com', 'Karlo Jay Libores', '$2y$12$HqY17nXgd1AD.GheC61buu3BS0qdh03Mdf.UQiMGK9zGQaoqzIeJG', NULL, 'data:image/png;base64,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.jpg', 'instructor', NULL, NULL, NULL, 'CCS', 'Programming', NULL, 'Active', 'scanned', '2026-03-21 12:44:55', NULL, NULL, '2026-03-09 03:41:49', '2026-03-21 12:44:55'),
	(23, NULL, '23-1231213', 'jonathan@gmail.com', 'Jonathan Jotojot', '$2y$12$WzEKLs2pvU9IcFsEyAw50O4okB4rA1JxkN8NoivRL2ak5IQ7VE7We', NULL, 'data:image/png;base64,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.jpg', 'instructor', NULL, NULL, NULL, 'CHM', 'Web Dev (Senior)', NULL, 'Active', 'scanned', '2026-03-21 11:30:25', NULL, NULL, '2026-03-10 10:34:15', '2026-03-21 11:30:25'),
	(24, NULL, '345356-345345', 'ryan@gmail.com', 'Ryan Jansin', '$2y$12$ChcK0xvFGwpTpvQLP3MT/.DfnPsDis7JA4SlQRDUENl81GfEXx0we', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAN1ElEQVR4AezdTXIbSQ4GUEafZNZzgr7/yifw2jeZ8U9bYbZIqcAqZAKZr6NlS1QSCTwwvl2F//qf/wgQINBE4K+b/wgQINBEQGA1WZQ2CRC43QTWRp8CoxLoLiCwum9Q/wQ2EhBYGy3bqAS6Cwis7hvUP4FHAou+JrAWXayxCKwoILBW3KqZCCwqILAWXayxCKwoILAebdVrBAiUFBBYJdeiKQIEHgkIrEcqXiNAoKSAwCq5Fk2NE3BTJwGB1WlbeiWwuYDA2vwDYHwCnQQEVqdt6ZXA5gInA2tzPeMTIDBUQGAN5XYZAQJnBATWGT3vJUBgqIDAGsrd+jLNE5guILCmr0ADBAgcFRBYR6WcI0BguoDAmr4CDRCoJ1C1o/TA+s9//775us6g2gcpe7fZ82b3v1v97H2lB1b2AOoTILCPgMDaZ9cmJdBeQGAlrFBJAgRyBARWjquqBAgkCAisBFQlCRDIERBYOa6q7iJgzqECAmsot8sIEDgjILDO6HkvAQJDBQTWUG6XESBwRmBuYJ3p3HsJENhOQGBtt3IDE+grUC6wvn39ctvpK/ujE32WLdpP9q6y+682b7ZntH7UJ/t8ucDKHlj9WQLuJXBeQGCdN1SBAIFBAgJrELRrCBA4LyCwzhuqQIDAvUDaTwIrjVZhAgSuFhBYV4uqR4BAmoDASqNVmACBqwUE1tWi5+upQIDAEwGB9QTGywQI1BMQWPV2oiMCBJ4ICKwnMF4mMELAHTGB9oEVfdYs+3yMf7/TUf/uQtF5s89392wfWN0XoH8CBI4LCKzjVk4SIDBZoHVgTbZzPQECgwUE1mBw1xEg8LqAwHrdzjsJEBgsILAGg7vuRQFvI/BdQGB9R/A/AQI9BARWjz3pkgCB7wIC6zuC/wkQqCTwvBeB9dzGbwgQKCYgsIotRDsECDwXEFjPbfyGAIFiAgKr2ELOt6MCgXUFBNa6uzUZgeUEBNZyKzUQgXUFBNa6uzXZ+gLbTSiwtlu5gQn0FRBYfXencwLbCQis7VZuYAJ9BXYOrL5b0zmBTQUE1qaLNzaBjgICq+PW9ExgUwGBtenidxvbvGsICKw19vh0im9fv9wiX9F/F+/pxX5BIEFAYCWgKkmAQI6AwMpxVZUAgQSBQ4GVcK+SBAgQCAsIrDCZNxAgMEtAYM2Sdy8BAmEBgRUmW/wNxiNQWEBgFV6O1ggQuBcQWPcefiJAoLCAwCq8HK0RyBXoV11g9duZjglsKyCwtl29wQn0E2gfWJHn5Eac7fcRuO84anT/7s9/yq7/eQdjT0TnzT4/dvrrb2sfWNeTHK3oHAECowUE1mhx9xEg8LKAwHqZzhsJEBgtILBGi7uvo4CeiwgIrCKL0AYBAp8LCKzPjZwgQKCIgMAqsghtECDwucCIwPq8CycIECBwQEBgHUByhACBGgICq8YedEGAwAEBgXUAyZHjAk4SyBQoF1jRfxev+/nM5f6oHfX58Z7IV3b9SC8jzkbn7X5+hGnkjnKBFWneWQIE9hIQWHvt27QErhOYUElgTUB3JQECrwkIrNfcvIsAgQkCAmsCuisJEHhNQGC95nb+XSoQIBAWEFhhMm8gQGCWgMCaJe9eAgTCAgIrTOYNBKICzl8lILCuklSHAIF0AYGVTuwCAgSuEkgPrOx/Z223+lctflad6LN12X3u9vnJnjd7X+mBdX4AFQgQIPBLQGD9cvAnAQINBARWgyVpkQCBXwIC65eDP2sI6ILAhwIC60MevyRAoJKAwKq0Db0QIPChgMD6kMcvCRDIEnilrsB6Rc17CBCYIiCwprC7lACBVwQE1itq3kOAwBQBgTWF/fylKhDYUSA9sKo9O1Ztybv5RJ9li+4r6hk9H+0nej7aT/b5aP/Z59MDK3sA9QkQ2EdAYO2za5N2FdD3m4DAeqPwDQEC1QUEVvUN6Y8AgTcBgfVG4RsCBKoLrB9Y1TegPwIEDgsIrMNUDhIgMFtAYM3egPsJEDgsILAOUzlYX0CHqwsIrNU3bD4CCwkIrIWWaRQCqwukB1b02bHos1HRBUXrR89H+4n6ROtHz2fPG+0nej7bM+oTPZ/df9Sz2vk/Aqtaa/ohQIDAvYDAuvfwEwEChQUEVuHlaI0AgXsBgXXvsctP5iTQUkBgtVybpgnsKSCw9ty7qQm0FBBYLdemaQLHBVY6KbBW2qZZCCwuILAWX7DxCKwkILBW2qZZCCwuILA+WbBfEyBQRyA9sLKfpcqun72qaP/R89Fn06Lnoz7Z/WfXj84b9Yz2372faP/pgRVtyHkCBAg8ExBYz2S8vp+AicsLCKzyK9IgAQK/BQTWbwl/EyBQXkBglV+RBgkQ+C1wXWD9ruhvAgQIJAkIrCRYZQkQuF5AYF1vqiIBAkkCAisJdu2ypiMwR0BgzXF3KwECLwgIrBfQvIUAgTkC6YEVfZZqDsPzW6P9R58Fi9Z/3unj30T7eVzlulez572u0x6Vsj2/ff1yi9yRrZYeWNkDqE+AwD4CAmufXZuUQHsBgdV+hQYgsI+AwMrdteoECFwoILAuxFSKAIFcAYGV66s6AQIXCgisCzGV2lvA9PkCAivf2A0ECFwkILAuglSGAIF8AYGVb+wGAgQuEigTWBfNowwBAgsLlAus7GffsutHnrv6cTa7n+hnN9rPjxkiX9F+nP9YILqv6PmPbx//23KBNZ7AjQQIdBEQWF02tVKfZiHwooDAehHO2wgQGC8gsMabu5EAgRcFBNaLcN5GgMARgWvPCKxrPVUjQCBRQGAl4ipNgMC1AgLrWk/VCBBIFBBYibjnS6tAgMCfAgLrTw3fEyBQWkBglV6P5ggQ+FOgXGBFnksbcfZPrIzvs2eI9hztJ1o/+ixb9Hx2/4nz3n7MGu0/+3x03uzz5QIre2D1CRDoKyCw+u5O5wS2ExBY263cwAT6CqwSWH03oHMCBA4LCKzDVA4SIDBbQGDN3oD7CRA4LCCwDlM5WEVAH/sKCKx9d29yAu0EBFa7lWmYwL4CAmvf3ZucQH2Bf3UosP4F4kcCBOoKpAfWj+ejfP398zmxKxyiH6Xos2bR+tGZsvvJ7j9aP/t81D/aT3b9aD/pgRVtyHkCBAg8ExBYz2RWeN0MBBYTEFiLLdQ4BFYWEFgrb9dsBBYTEFiLLdQ4uwrsMbfA2mPPpiSwhIDAWmKNhiCwh4DA2mPPpiSwhIDA+rlGfxAg0EFAYHXYkh4JEPgpILB+MviDAIEOAuUCK/qsWffzHT4kH/UY9S/wbNrdONH+o+fvLmv4Q7V5ywVWw51qmQCBQQICaxC0awgQOC8gsM4bqkCAwCCBaGANass1BAgQeC8gsN6beIUAgaICAqvoYrRFgMB7AYH13sQr/wj4i0A1AYFVbSP6IUDgqYDAekrjFwQIVBMQWNU2oh8CMwSa3CmwmixKmwQI3G7tAyv6bFr2+d0+VFHPas+mRfeVPW+1+lGf7PPtAysbSH0CBOoICKwrdqEGAQJDBATWEGaXECBwhYDAukJRDQIEhggIrCHMLllHwCQzBQTWTH13EyAQEhBYIS6HCRCYKSCwZuq7mwCBkMDgwAr15jABAgTuBATWHYcfCBCoLCCwKm9HbwQI3AkIrDsOP1z4LNvt0XOD3YUfzfTRa9F5P6r16HfV6kf7iZ4XWFEx5wkQmCYgsKbRu5gAgaiAwIqKOU+AwDuBUS8IrFHS7iFA4LSAwDpNqAABAqMEBNYoafcQIHBaQGCdJjxfQAUCBI4JCKxjTk4RIFBAQGAVWIIWCBA4JiCwjjk5ReAaAVVOCQisU3zeTIDASAGBNVK7wV2Pnlf76LXos4dRgo/ufvS7aD/R89H+s89H+88+nz2vwMoWVp8AgcsEegXWZWMrRIBARwGB1XFreiawqYDA2nTxxibQUUBgddzaFj0bksB7AYH13sQrBAgUFRBYRRejLQIE3gsIrPcmXiFAYKzA4dsE1mEqBwkQmC0gsGZvwP0ECBwWEFiHqRwkQGC2QPvAevQ82czXJix06pVR6+xmo/1Ez0efxYvOG60f7T96Ptp/9vn2gZUNpD4BAnUEBFadXeiEAIFPBATWJ0B+TaCSwO69CKzdPwHmJ9BIQGA1WpZWCewuILB2/wSYn0Ajga0Cq9FetEqAwAMBgfUAxUsECNQUEFg196IrAgQeCAisByheWkDACEsKCKwl12ooAmsKlAus6LNU3c9nf6yyfaL9R/uJ1q92vvu81Z49LBdY1T5w+iFAoI7A48Cq059OCBAg8CYgsN4ofEOAQHUBgVV9Q/ojQOBNQGC9Uez6jbkJ9BEQWH12pVMC2wsIrO0/AgAI9BEQWH12pVMCZwXav19gtV+hAQjsIyCw9tm1SQm0FxBY7VdoAAL7CKQHVvRZpMLnbxV6i340s3vO7idaP/t8tme0fva81eqnB1a1gfVDgEBfAYHVd3c6J7CdgMDabuUGPiLgTE0BgVVzL7oiQOCBgMB6gOIlAgRqCgismnvRFQECDwRSAuvBPV4iQIDAaQGBdZpQAQIERgkIrFHS7iFA4LSAwDpNuHkB4xMYKCCwBmK7igCBcwIC65yfdxMgMFBAYA3EdhWB3gLzuxdY83egAwIEDgoIrINQjhEgMF9AYM3fgQ4IEDgoILAOQp0/pgIBAmcFBNZZQe8nQGCYgMAaRu0iAgTOCgiss4LeT+C9gFeSBARWEqyyBAhcLyCwrjdVkQCBJAGBlQSrLAEC1wv8HwAA//+8NochAAAABklEQVQDAGCk3sY+iebFAAAAAElFTkSuQmCC', 'instructors/sZbr3Q7pP4IHZaIIyDAptZ3up3bmmU0ZBIXceQax.jpg', 'instructor', NULL, NULL, NULL, 'CHM', 'Animation', NULL, 'Active', 'unscanned', '2026-03-10 22:40:40', NULL, NULL, '2026-03-10 22:38:16', '2026-03-10 22:40:40'),
	(25, 'STF-69B7C20258E48', NULL, 'wawangnegre20@gmail.com', 'Wawang Negre', '$2y$12$hxsjRNNOtrqotU5YnHO.keMPlh4DC.W4rrj0.b/SWk5.HJVEqhgky', '12312', NULL, 'staff/iE3yOCH6f8A0fmiw02O2Gqn12Zj9DeG2tEFENez3.jpg', 'staff', '091231231', '2022-12-23', 'Male', NULL, NULL, 23, 'Active', 'unscanned', NULL, NULL, NULL, '2026-03-16 00:40:34', '2026-03-16 00:40:34');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
