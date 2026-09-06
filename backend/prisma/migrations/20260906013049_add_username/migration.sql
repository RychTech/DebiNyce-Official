-- AlterTable
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `User_username_key`(`username`);