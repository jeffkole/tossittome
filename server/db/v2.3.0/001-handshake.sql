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

create table if not exists email_queue (
  id                bigint unsigned not null auto_increment primary key,
  `type`            varchar(48) not null,
  status            varchar(48) not null,
  reject_reason     varchar(128) null comment 'A reason for rejection taken straight from the email service provider',
  created_at        timestamp not null default current_timestamp,
  updated_at        timestamp null comment 'When the status last changed',
  sender_message_id varchar(32) not null comment 'The email service provider''s message ID',
  subject_template  varchar(128) character set 'utf8' not null comment 'The template to render the email subject',
  body_template     text character set 'utf8' not null comment 'The template to render the email body',
  data              varchar(1024) character set 'utf8' not null comment 'The data used for rendering subject and body in JSON',

  index sender_message_id_ndx (sender_message_id)
)
comment = 'Queue of emails'
;
