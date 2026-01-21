import DashboardClient from "./DashboardClient";

export default function DashboardPage({ searchParams }: { searchParams: Promise<{ mode?: string, year?: string }> }) {
    return <DashboardClient searchParams={searchParams} />;
}
