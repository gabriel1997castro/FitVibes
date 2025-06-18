-- Clear all votes
DELETE FROM votes;

-- Reset all activity statuses to pending
UPDATE activities SET status = 'pending';