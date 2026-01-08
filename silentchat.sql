-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 08, 2026 at 12:16 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `silentchat`
--

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` char(36) NOT NULL,
  `room_id` varchar(64) NOT NULL,
  `sender_id` varchar(64) NOT NULL,
  `receiver_id` varchar(64) DEFAULT NULL,
  `msg_type` varchar(20) NOT NULL,
  `iv_b64` text NOT NULL,
  `ciphertext_b64` mediumtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `room_id`, `sender_id`, `receiver_id`, `msg_type`, `iv_b64`, `ciphertext_b64`, `created_at`) VALUES
('45023adc-9b21-4f31-b3d0-81b1af0c4816', 'team0', '3844f161', 'b7036c66', 'emoji', '+/gBgjvfAKQRAmhn', 'URofSoYqouWuU9m3oaKCGEnPES1Wnx8AGAWS7D3SeXJGEGg/2th4jBPfblUfCDE1+DtECrnYwvUIIY1eIWkbGIsg', '2026-01-08 09:18:02'),
('61916ec8-cccc-4d7e-92ae-382764617aff', 'team0', 'b7036c66', '3844f161', 'sticker', 'DKHrTKXr53zwQKnn', 'rIcP/DrJ2WTe1qXzpop7rQHagNDZI+QZxS5NXmWhub2LdPNMrhaHim6iY6hj9G+3AtpnNM/SQi7uLPzDYOXvIlEVX9ov7ww3mV30NgY=', '2026-01-08 09:18:13'),
('98e6b3d0-797b-425b-a91e-20ec5de8a23b', 'team0', 'b7036c66', '3844f161', 'emoji', 'DwShbtuQYjM/aK2T', 'kBRUEO+2AAOe3uHujeCkLEyhwUioWrw84z2lUvo1etK2sAPL5/A6zDpyfmfgHA3tH9odB8jnyXL7m1Vdm+gg9uO2', '2026-01-08 09:17:58'),
('9c2c1571-b11d-4570-9725-93fd377771d0', 'team0', '3844f161', 'b7036c66', 'sticker', 'fdf9D6cdBtJcpuLZ', 'h6dpdfBUjUVfAv5Xp4j59WL6sopURU4tT30QDe47uz0Owi7YIh09ZR6GcfpslaVl784qLSrVH6hyfZXkXK1kDaVz43xR2cjxflNYurppj0SILw==', '2026-01-08 09:18:16'),
('a8f820cb-620b-48aa-ae08-c934c082ce12', 'team0', '3844f161', 'b7036c66', 'sticker', 'fedOarJiEQk4pZd4', 'SPWlIhUf14n4luJj9cPQViNbK7Y70RaJpEHR2uG4An8DW2unGVL0dJ296HYgEYqqVomYJ8ukFL4QdZH71bW5KMKsLbXpfxjWMvQQtWZZN0Po', '2026-01-08 09:18:17'),
('ee25a267-1293-469c-b900-fbf165a9045f', 'team0', 'b7036c66', '3844f161', 'sticker', 'ngQ3htn+VEhH/r9O', 'gfgMImhViQVbDPBKkMUJqw1r0QDpqyUgtnXwJqR5bnwrd2lb9FCJOQVNp3HOpfr8HwbEeFMfyXKq7FO6v8kxYJ6IiLXneaxaO7xcO4bkQGXE', '2026-01-08 09:18:11');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `created_at`) VALUES
('team0', '2026-01-08 09:17:27'),
('team9', '2026-01-08 09:02:02');

-- --------------------------------------------------------

--
-- Table structure for table `room_members`
--

CREATE TABLE `room_members` (
  `room_id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_members`
--

INSERT INTO `room_members` (`room_id`, `user_id`, `joined_at`) VALUES
('team0', '3844f161', '2026-01-08 09:17:27'),
('team0', 'b7036c66', '2026-01-08 09:17:36'),
('team9', '3844f161', '2026-01-08 09:02:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `display_name`, `created_at`) VALUES
('3844f161', NULL, '2026-01-08 09:02:02'),
('b7036c66', NULL, '2026-01-08 09:17:36');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_room_time` (`room_id`,`created_at`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `room_members`
--
ALTER TABLE `room_members`
  ADD PRIMARY KEY (`room_id`,`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
