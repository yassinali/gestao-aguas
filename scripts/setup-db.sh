# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy

# Seed initial data (optional)
echo "Database setup complete!"
