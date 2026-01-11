-- SQL script to update the imageUrl column type in the events table
-- This fixes the issue where images are truncated due to small column size

-- For MySQL
ALTER TABLE events MODIFY COLUMN imageUrl LONGTEXT NULL;

-- Note: After running this, existing events with truncated images will need to be recreated
-- OR you can delete the column and let TypeORM recreate it:
-- ALTER TABLE events DROP COLUMN imageUrl;
-- (Then restart the backend and TypeORM will recreate it with the correct type)
