"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CarFront, Loader2, RefreshCw, ShieldCheck, UserRound, Users } from "lucide-react"
import AppHeader from "@/components/app-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { authenticatedFetch, getGatewayBaseUrl } from "@/lib/auth-client"

type Role = "ADMIN" | "DRIVER" | "FLEET_MANAGER" | "SUPERVISOR" | "WORKER"

interface CompanyStaff {
  id: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  status?: string
  role?: Role | null
  vehicle?: { id: number; licensePlate?: string } | null
}

interface CompanyRequest {
  id: number
  nexxauthUserId: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: Role | null
  status?: string
}

interface AdminRequest extends CompanyRequest {
  companyCode: string
}

async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await authenticatedFetch(`${getGatewayBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })
  } catch {
    throw new Error("Could not reach Cavgo. Check your connection and try again.")
  }

  if (!response.ok) {
    const body = await response.text()
    let message = `Request failed (HTTP ${response.status})`
    if (body) {
      try {
        const parsed = JSON.parse(body) as { message?: unknown; error?: unknown }
        if (typeof parsed.message === "string") message = parsed.message
        else if (typeof parsed.error === "string") message = parsed.error
      } catch {
        message = body
      }
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function displayName(person: { firstName?: string; lastName?: string; email?: string }, id: number) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim()
  return name || person.email || `User ${id}`
}

export default function CompanyAdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [staff, setStaff] = useState<CompanyStaff[]>([])
  const [accessRequests, setAccessRequests] = useState<CompanyRequest[]>([])
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([])
  const [activeTab, setActiveTab] = useState("users")
  const [roleDrafts, setRoleDrafts] = useState<Record<number, Role>>({})
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  const companyId = user?.companyId
  const isCompanyAdmin = user?.companyUserRole?.toUpperCase() === "ADMIN"

  const loadData = useCallback(async (showSpinner = true) => {
    if (!companyId) return
    if (showSpinner) setLoading(true)
    try {
      const base = `/main/company-admin/companies/${companyId}`
      const [nextStaff, nextAccessRequests, nextAdminRequests] = await Promise.all([
        adminApi<CompanyStaff[]>(`${base}/staff`),
        adminApi<CompanyRequest[]>(`${base}/access-requests`),
        adminApi<AdminRequest[]>(`${base}/admin-access-requests`),
      ])
      setStaff(nextStaff)
      setAccessRequests(nextAccessRequests)
      setAdminRequests(nextAdminRequests)
      setRoleDrafts(Object.fromEntries(nextStaff.map((member) => [member.id, member.role ?? "WORKER"])))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load company user management")
      throw loadError
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (authLoading) return
    if (companyId && isCompanyAdmin) void loadData().catch(() => undefined)
    else setLoading(false)
  }, [authLoading, companyId, isCompanyAdmin, loadData])

  const performAction = useCallback(async (key: string, action: () => Promise<void>, successMessage: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusyAction(key)
    setError(null)
    try {
      await action()
      await loadData(false)
      setError(null)
      toast({ title: "Success", description: successMessage })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The action could not be completed")
    } finally {
      busyRef.current = false
      setBusyAction(null)
    }
  }, [loadData, toast])

  const companyBase = companyId ? `/main/company-admin/companies/${companyId}` : ""

  if (authLoading || loading || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader showViewSwitcher={false} />
        <div className="mx-auto max-w-6xl space-y-4 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    )
  }

  if (!user || !companyId || !isCompanyAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <AppHeader showViewSwitcher={false} />
        <div className="mx-auto max-w-2xl p-6">
          <Alert variant="destructive">
            <ShieldCheck />
            <AlertTitle>Company administrator access required</AlertTitle>
            <AlertDescription>
              This area is available only to an administrator with an active membership in this company.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/")}>
            <ArrowLeft /> Back to fleet
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <AppHeader showViewSwitcher={false} />
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" aria-label="Back to fleet" onClick={() => router.push("/")}>
              <ArrowLeft />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Company user management</h1>
              <p className="text-sm text-muted-foreground">{user.companyName || "Your company"}</p>
            </div>
          </div>
          <Button variant="outline" disabled={busyAction !== null} onClick={() => void loadData().catch(() => undefined)}>
            <RefreshCw /> Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Could not complete the request</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="users"><Users /> Users ({staff.length})</TabsTrigger>
            <TabsTrigger value="requests"><UserRound /> User requests ({accessRequests.length})</TabsTrigger>
            <TabsTrigger value="admin-requests"><ShieldCheck /> Admin requests ({adminRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 space-y-3">
            {staff.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No company members found.</CardContent></Card>
            ) : staff.map((member) => {
              const isSelf = member.id === user.userId
              const role = member.role ?? "WORKER"
              const isProtectedSupervisor = role === "SUPERVISOR"
              const isBusy = busyAction !== null
              return (
                <Card key={member.id}>
                  <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{displayName(member, member.id)}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[member.email, member.phone].filter(Boolean).join(" · ") || `User ID ${member.id}`}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-secondary px-2 py-1">{role.replaceAll("_", " ")}</span>
                        {member.status && <span className="text-muted-foreground">{member.status}</span>}
                        {member.vehicle && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <CarFront className="h-3.5 w-3.5" />
                            {member.vehicle.licensePlate || `Vehicle ${member.vehicle.id}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {member.vehicle && role === "DRIVER" && (
                        <Button
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => void performAction(
                            `unassign:${member.id}`,
                            () => adminApi<void>(`${companyBase}/staff/${member.id}/driver-assignments`, { method: "DELETE" }),
                            "Driver vehicle assignment removed",
                          )}
                        >
                          {busyAction === `unassign:${member.id}` ? <Loader2 className="animate-spin" /> : <CarFront />}
                          Remove car
                        </Button>
                      )}
                      {!isProtectedSupervisor && (
                        <>
                          <select
                            aria-label={`Role for ${displayName(member, member.id)}`}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={roleDrafts[member.id] ?? role}
                            disabled={isSelf || isBusy}
                            onChange={(event) => setRoleDrafts((current) => ({
                              ...current,
                              [member.id]: event.target.value as Role,
                            }))}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="FLEET_MANAGER">FLEET_MANAGER</option>
                            <option value="DRIVER">DRIVER</option>
                            <option value="WORKER">WORKER</option>
                          </select>
                          <Button
                            variant="outline"
                            disabled={isSelf || isBusy || roleDrafts[member.id] === role}
                            onClick={() => void performAction(
                              `role:${member.id}`,
                              async () => {
                                await adminApi<CompanyStaff>(`${companyBase}/staff/${member.id}/role`, {
                                  method: "PUT",
                                  body: JSON.stringify({ role: roleDrafts[member.id] }),
                                })
                              },
                              "Company role updated",
                            )}
                          >
                            {busyAction === `role:${member.id}` ? <Loader2 className="animate-spin" /> : null}
                            Update role
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={isSelf || isBusy}
                            onClick={() => {
                              if (window.confirm(`Remove ${displayName(member, member.id)} from this company?`)) {
                                void performAction(
                                  `remove:${member.id}`,
                                  () => adminApi<void>(`${companyBase}/staff/${member.id}`, { method: "DELETE" }),
                                  "User removed from company",
                                )
                              }
                            }}
                          >
                            {busyAction === `remove:${member.id}` ? <Loader2 className="animate-spin" /> : null}
                            Remove user
                          </Button>
                        </>
                      )}
                      {isSelf && <span className="text-xs text-muted-foreground">You cannot change your own access.</span>}
                      {isProtectedSupervisor && <span className="text-xs text-muted-foreground">Supervisor access is managed separately.</span>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-3">
            {accessRequests.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No pending company user requests.</CardContent></Card>
            ) : accessRequests.map((request) => (
              <RequestCard
                key={request.id}
                title={displayName(request, request.nexxauthUserId)}
                detail={[request.email, request.phone].filter(Boolean).join(" · ")}
                role={request.role}
                busy={busyAction !== null}
                onApprove={() => void performAction(
                  `access-approve:${request.id}`,
                  () => adminApi<void>(`${companyBase}/access-requests/${request.id}/approve`, { method: "POST" }),
                  "Company user request approved",
                )}
                onReject={() => void performAction(
                  `access-reject:${request.id}`,
                  () => adminApi<void>(`${companyBase}/access-requests/${request.id}/reject`, { method: "POST", body: JSON.stringify({}) }),
                  "Company user request rejected",
                )}
              />
            ))}
          </TabsContent>

          <TabsContent value="admin-requests" className="mt-4 space-y-3">
            {adminRequests.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No pending company administrator requests.</CardContent></Card>
            ) : adminRequests.map((request) => (
              <RequestCard
                key={request.id}
                title={displayName(request, request.nexxauthUserId)}
                detail={[request.email, request.phone, `Company code ${request.companyCode}`].filter(Boolean).join(" · ")}
                role="ADMIN"
                busy={busyAction !== null}
                admin
                onApprove={() => {
                  if (window.confirm(`Grant company administrator access to ${displayName(request, request.nexxauthUserId)}?`)) {
                    void performAction(
                      `admin-approve:${request.id}`,
                      () => adminApi<void>(`${companyBase}/admin-access-requests/${request.id}/approve`, { method: "POST" }),
                      "Company administrator request approved",
                    )
                  }
                }}
                onReject={() => void performAction(
                  `admin-reject:${request.id}`,
                  () => adminApi<void>(`${companyBase}/admin-access-requests/${request.id}/reject`, { method: "POST", body: JSON.stringify({}) }),
                  "Company administrator request rejected",
                )}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function RequestCard({
  title,
  detail,
  role,
  busy,
  admin = false,
  onApprove,
  onReject,
}: {
  title: string
  detail: string
  role?: Role | null
  busy: boolean
  admin?: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{detail || "No contact information provided"}</CardDescription>
          </div>
          {role && <span className="rounded-full bg-secondary px-2 py-1 text-xs">{role.replaceAll("_", " ")}</span>}
        </div>
      </CardHeader>
      <CardContent className="flex gap-2 pt-4">
        <Button disabled={busy} onClick={onApprove}>
          {busy ? <Loader2 className="animate-spin" /> : admin ? <ShieldCheck /> : <UserRound />}
          {admin ? "Approve admin" : "Approve user"}
        </Button>
        <Button variant="outline" disabled={busy} onClick={onReject}>Reject</Button>
      </CardContent>
    </Card>
  )
}
