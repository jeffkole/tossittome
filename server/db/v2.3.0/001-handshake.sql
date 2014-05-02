create table if not exists catcher_requests (
  id                 bigint unsigned not null auto_increment primary key,
  token              varchar(128) not null unique key,
  requesting_user_id bigint unsigned not null comment 'The users.id of the requesting user',
  catcher_email      varchar(128) not null comment 'The email address of the proposed catcher',
  created_at         timestamp not null default current_timestamp,
  status             varchar(48) not null default 'open' comment '"open", "accepted", "rejected", or "ignored"',
  updated_at         timestamp null comment 'When the status last changed'
)
comment = 'Requests for tossing authorization'
;
