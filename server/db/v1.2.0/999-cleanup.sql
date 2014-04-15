-- Set the catcher_id to non-nullable after the app has been updated
alter table pages
  modify column catcher_id bigint unsigned not null comment 'The users.id of the catcher';
