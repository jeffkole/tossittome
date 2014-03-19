create table if not exists users (
  id         bigint unsigned not null auto_increment primary key,
  email      varchar(128) not null unique key,
  token      varchar(128) not null unique key,
  created_at timestamp not null default current_timestamp
);

create table if not exists sites (
  id         bigint unsigned not null auto_increment primary key,
  user_id    bigint unsigned not null,
  site       varchar(1024) not null,
  created_at timestamp not null default current_timestamp,
  served_at  timestamp null
);
