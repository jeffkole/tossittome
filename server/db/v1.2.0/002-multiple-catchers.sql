-- Stores the relationship between a tosser and catchers who will accept tosses
create table if not exists catchers (
  id         bigint unsigned not null auto_increment primary key,
  tosser_id  bigint unsigned not null comment 'The users.id of the tosser',
  catcher_id bigint unsigned not null comment 'The users.id of the catcher',
  created_at timestamp not null default current_timestamp,
  constraint unique key tosser_catcher_uk (tosser_id, catcher_id)
);

alter table pages
  modify column user_id bigint unsigned not null comment 'The users.id of the tosser',
  add column catcher_id bigint unsigned comment 'The users.id of the catcher' after user_id;

update pages set catcher_id = user_id;
