SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'group_categories';
