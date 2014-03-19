create table if not exists sites (
  id bigint unsigned not null auto_increment primary key,
  user varchar(48) not null,
  site varchar(1024) not null,
  created_at timestamp not null default current_timestamp,
  served_at timestamp null
);
