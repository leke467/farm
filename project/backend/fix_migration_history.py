import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'terra_track.settings')
django.setup()

from django.db import connection

def fix_migration_history():
    print("=== CHECKING MIGRATION HISTORY SEQUENCE ===")
    try:
        with connection.cursor() as cursor:
            tables = connection.introspection.table_names(cursor)
            if 'django_migrations' not in tables:
                print("django_migrations table does not exist yet. Skipping.")
                return

            cursor.execute("SELECT id, applied FROM django_migrations WHERE app = %s AND name = %s;", ['admin', '0001_initial'])
            admin_row = cursor.fetchone()

            cursor.execute("SELECT id, applied FROM django_migrations WHERE app = %s AND name = %s;", ['accounts', '0001_initial'])
            accounts_row = cursor.fetchone()

            earlier_time = timezone.now() - timedelta(hours=2)

            if admin_row and not accounts_row:
                print("Fixing migration sequence: Fake-recording accounts.0001_initial before admin.0001_initial...")
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s);",
                    ['accounts', '0001_initial', earlier_time]
                )
                print("Successfully recorded accounts.0001_initial!")
            elif admin_row and accounts_row:
                admin_id, admin_time = admin_row
                accounts_id, accounts_time = accounts_row
                if accounts_id > admin_id or (admin_time and accounts_time and accounts_time >= admin_time):
                    print("Fixing migration sequence: Repositioning accounts.0001_initial timestamp before admin...")
                    adjusted_time = (admin_time - timedelta(minutes=5)) if admin_time else earlier_time
                    cursor.execute(
                        "UPDATE django_migrations SET applied = %s WHERE app = %s AND name = %s;",
                        [adjusted_time, 'accounts', '0001_initial']
                    )
                    print("Successfully updated accounts migration timestamp!")

            print("Migration history check complete.")
    except Exception as e:
        print(f"Migration fix info: {e}")

if __name__ == '__main__':
    fix_migration_history()
