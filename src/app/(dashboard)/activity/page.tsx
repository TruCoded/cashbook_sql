import { Card, CardContent } from "@/components/ui/card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function ActivityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-primary">Activity</h1>
      <Card>
        <CardContent>
          <ActivityFeed />
        </CardContent>
      </Card>
    </div>
  );
}
