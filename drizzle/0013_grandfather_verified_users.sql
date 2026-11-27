-- Accounts created before verification was enforced are grandfathered in so
-- existing users are not locked out of their workspaces.
UPDATE "user" SET email_verified = true WHERE email_verified = false;
