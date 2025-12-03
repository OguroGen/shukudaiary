-- Enable Realtime for homeworks table
-- This allows clients to subscribe to changes in the homeworks table
ALTER PUBLICATION supabase_realtime ADD TABLE homeworks;

