import React, { useId, useMemo, useState } from "react";
import { 
  ArrowUpDown, 
  Check, 
  ChevronRight, 
  Eye, 
  Filter, 
  Layers, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Phone, 
  Search, 
  SlidersHorizontal,
  Sparkles,
  User,
  X
} from "lucide-react";

/**
 * ============================================================================
 * BREAKPOINT ARCHITECTURE & LOGIC EXPLANATION:
 * ============================================================================
 * 1. Desktop View (viewport / container >= 1024px):
 *    - Rendered as a multi-column horizontal list/table row.
 *    - Information density is high: Avatar, Primary Title, Secondary Role/Category,
 *      Metric/Progress, Status Badge, and Action Buttons align horizontally.
 *    - Includes sticky/accessible header row with column sorting semantics.
 *
 * 2. Tablet View (viewport / container 768px - 1023px):
 *    - Transformed into a balanced 2-column grid of intermediate cards.
 *    - Metadata is grouped in a 2x2 internal data grid with balanced touch targets.
 *
 * 3. Mobile View (viewport / container < 768px):
 *    - Transformed into full-width stacked vertical cards.
 *    - Touch targets scale to >= 44px for thumb comfort.
 *    - Actions span the full card footer or stack with high-contrast buttons.
 *
 * Technical implementation:
 * - Single source of truth: `data` array with declarative column and action schema.
 * - CSS Container Queries (`@container (min-width: ... )`) with Media Query fallback
 *   to avoid any JavaScript-induced Layout Shift (CLS) or FOUC during resizing.
 * - ARIA semantics & keyboard accessibility preserved across all layouts.
 * ============================================================================
 */

export interface ResponsiveDataItem {
  id: string | number;
  avatarUrl?: string | null;
  initials?: string;
  title: string;
  subtitle: string;
  roleOrCategory: string;
  status: "active" | "pending" | "completed" | "archived" | "inactive";
  statusLabel?: string;
  progressPercentage?: number;
  progressLabel?: string;
  metaTags?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  detailsUrl?: string;
  raw?: unknown;
}

export interface ResponsiveDataTransformProps<T extends ResponsiveDataItem = ResponsiveDataItem> {
  /** The single source of truth dataset */
  items: T[];
  /** Optional title for the data section */
  title?: string;
  /** Optional subtitle or count label */
  subtitle?: string;
  /** Primary click handler when an item is selected or viewed */
  onItemClick?: (item: T) => void;
  /** Action handlers */
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  /** Custom extra actions renderer */
  renderCustomActions?: (item: T) => React.ReactNode;
  /** Search and filtering enable */
  enableSearch?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Optional container query class or custom container ID */
  className?: string;
}

export function ResponsiveDataTransform<T extends ResponsiveDataItem>({
  items,
  title = "Directory & Records",
  subtitle,
  onItemClick,
  onEdit,
  onDelete,
  renderCustomActions,
  enableSearch = true,
  emptyMessage = "No matching records found.",
  className = "",
}: ResponsiveDataTransformProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"title" | "status" | "progress">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [layoutOverride, setLayoutOverride] = useState<"auto" | "table" | "cards">("auto");
  const componentId = useId();

  // Filtered & Sorted items (Single Source of Truth)
  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          searchTerm.trim() === "" ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.roleOrCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.metaTags && item.metaTags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesStatus =
          statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === "title") {
          comparison = a.title.localeCompare(b.title);
        } else if (sortField === "status") {
          comparison = a.status.localeCompare(b.status);
        } else if (sortField === "progress") {
          comparison = (a.progressPercentage ?? 0) - (b.progressPercentage ?? 0);
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [items, searchTerm, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: "title" | "status" | "progress") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getStatusBadgeClass = (status: ResponsiveDataItem["status"]) => {
    switch (status) {
      case "active":
        return "rdt-badge-active";
      case "completed":
        return "rdt-badge-completed";
      case "pending":
        return "rdt-badge-pending";
      case "archived":
      case "inactive":
      default:
        return "rdt-badge-inactive";
    }
  };

  return (
    <section 
      className={`rdt-container ${layoutOverride !== "auto" ? `force-${layoutOverride}` : ""} ${className}`}
      aria-label={title}
      id={`rdt-section-${componentId}`}
    >
      {/* Control Bar & Filter Header */}
      <div className="rdt-header-card">
        <div className="rdt-header-top">
          <div>
            <div className="rdt-eyebrow">
              <Sparkles size={14} className="rdt-eyebrow-icon" />
              <span>Responsive Data Transform Engine</span>
            </div>
            <h2 className="rdt-title">{title}</h2>
            <p className="rdt-subtitle">
              {subtitle || `${processedItems.length} records · Adapts automatically between Desktop List, Tablet 2-Col, and Mobile Cards.`}
            </p>
          </div>

          {/* View mode switcher (Auto vs Forced) */}
          <div className="rdt-view-toggle" role="group" aria-label="Layout density mode">
            <button
              type="button"
              className={`rdt-toggle-btn ${layoutOverride === "auto" ? "is-active" : ""}`}
              onClick={() => setLayoutOverride("auto")}
              title="Auto-responsive (CSS Container/Viewport driven)"
            >
              <Layers size={15} />
              <span className="hidden sm:inline">Auto</span>
            </button>
            <button
              type="button"
              className={`rdt-toggle-btn ${layoutOverride === "table" ? "is-active" : ""}`}
              onClick={() => setLayoutOverride("table")}
              title="Force Desktop List/Table View"
            >
              <List size={15} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              className={`rdt-toggle-btn ${layoutOverride === "cards" ? "is-active" : ""}`}
              onClick={() => setLayoutOverride("cards")}
              title="Force Card Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        {enableSearch && (
          <div className="rdt-filter-bar">
            <div className="rdt-search-wrap">
              <Search size={16} className="rdt-search-icon" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, role, tags, or details..."
                className="rdt-search-input"
                aria-label="Search records"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="rdt-clear-search"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="rdt-filter-group">
              <div className="rdt-select-wrap">
                <Filter size={14} className="rdt-select-icon" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rdt-select"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="rdt-select-wrap">
                <SlidersHorizontal size={14} className="rdt-select-icon" />
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-") as [
                      "title" | "status" | "progress",
                      "asc" | "desc"
                    ];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="rdt-select"
                  aria-label="Sort order"
                >
                  <option value="title-asc">Name (A-Z)</option>
                  <option value="title-desc">Name (Z-A)</option>
                  <option value="progress-desc">Highest Progress</option>
                  <option value="progress-asc">Lowest Progress</option>
                  <option value="status-asc">Status</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Responsive Data Display Wrapper */}
      <div className="rdt-data-wrapper" role="region" aria-live="polite">
        {processedItems.length === 0 ? (
          <div className="rdt-empty-state">
            <User size={36} className="rdt-empty-icon" />
            <h3>{emptyMessage}</h3>
            <p>Try refining your search terms or resetting the active status filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="rdt-reset-btn"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* =========================================================
                DESKTOP TABLE / LIST HEADER (Rendered via CSS at >= 1024px)
                ========================================================= */}
            <div className="rdt-desktop-table-header" role="row">
              <div className="rdt-col rdt-col-profile">
                <button
                  type="button"
                  onClick={() => toggleSort("title")}
                  className="rdt-sort-header-btn"
                >
                  <span>Student / Member</span>
                  <ArrowUpDown size={13} />
                </button>
              </div>
              <div className="rdt-col rdt-col-role">
                <span>Role & Track</span>
              </div>
              <div className="rdt-col rdt-col-metric">
                <button
                  type="button"
                  onClick={() => toggleSort("progress")}
                  className="rdt-sort-header-btn"
                >
                  <span>Progress / Score</span>
                  <ArrowUpDown size={13} />
                </button>
              </div>
              <div className="rdt-col rdt-col-status">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="rdt-sort-header-btn"
                >
                  <span>Status</span>
                  <ArrowUpDown size={13} />
                </button>
              </div>
              <div className="rdt-col rdt-col-actions">
                <span>Actions</span>
              </div>
            </div>

            {/* =========================================================
                UNIFIED DATA LIST / GRID (Single markup transformed via CSS)
                ========================================================= */}
            <ul className="rdt-list-flow" role="list">
              {processedItems.map((item) => {
                const initials =
                  item.initials ||
                  item.title
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                const isInteractive = Boolean(onItemClick || item.detailsUrl);

                return (
                  <li key={item.id} className="rdt-row-card-item" role="listitem">
                    <article
                      className={`rdt-card-surface ${isInteractive ? "is-clickable" : ""}`}
                      onClick={() => {
                        if (onItemClick) onItemClick(item);
                      }}
                    >
                      {/* 1. Primary Profile Column (Desktop Col 1 / Card Header) */}
                      <div className="rdt-profile-section">
                        <div className="rdt-avatar-frame" aria-hidden="true">
                          {item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt={item.title}
                              className="rdt-avatar-img"
                              loading="lazy"
                            />
                          ) : (
                            <span className="rdt-avatar-initials">{initials}</span>
                          )}
                        </div>

                        <div className="rdt-profile-text">
                          <div className="rdt-title-row">
                            <h3 className="rdt-item-title">{item.title}</h3>
                            {/* Mobile inline badge */}
                            <span className={`rdt-status-badge mobile-only ${getStatusBadgeClass(item.status)}`}>
                              {item.statusLabel || item.status}
                            </span>
                          </div>
                          <p className="rdt-item-subtitle">{item.subtitle}</p>

                          {/* Contact quick links */}
                          {item.contactInfo?.email && (
                            <span className="rdt-contact-line">
                              {item.contactInfo.email}
                              {item.contactInfo.phone && ` · ${item.contactInfo.phone}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Role & Tags Column (Desktop Col 2 / Card Body) */}
                      <div className="rdt-role-section">
                        <div className="rdt-role-label-wrap">
                          <span className="rdt-meta-heading">Role & Program</span>
                          <strong className="rdt-role-text">{item.roleOrCategory}</strong>
                        </div>
                        {item.metaTags && item.metaTags.length > 0 && (
                          <div className="rdt-tags-row">
                            {item.metaTags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="rdt-tag-pill">
                                {tag}
                              </span>
                            ))}
                            {item.metaTags.length > 3 && (
                              <span className="rdt-tag-pill rdt-tag-more">
                                +{item.metaTags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. Metrics & Progress Column (Desktop Col 3 / Card Stats) */}
                      <div className="rdt-metric-section">
                        <div className="rdt-metric-header">
                          <span className="rdt-meta-heading">Progress</span>
                          {item.progressPercentage !== undefined && (
                            <strong className="rdt-metric-val">{item.progressPercentage}%</strong>
                          )}
                        </div>
                        {item.progressPercentage !== undefined && (
                          <div className="rdt-progress-bar-track" aria-hidden="true">
                            <div
                              className="rdt-progress-bar-fill"
                              style={{ width: `${Math.min(100, item.progressPercentage)}%` }}
                            />
                          </div>
                        )}
                        <span className="rdt-metric-label">
                          {item.progressLabel || (item.progressPercentage !== undefined ? "Completed coursework" : "Standard pacing")}
                        </span>
                      </div>

                      {/* 4. Status Badge (Desktop Col 4) */}
                      <div className="rdt-status-section desktop-tablet-only">
                        <span className={`rdt-status-badge ${getStatusBadgeClass(item.status)}`}>
                          {item.statusLabel || item.status}
                        </span>
                      </div>

                      {/* 5. Actions Column (Desktop Col 5 / Card Footer) */}
                      <div className="rdt-actions-section" onClick={(e) => e.stopPropagation()}>
                        {renderCustomActions ? (
                          renderCustomActions(item)
                        ) : (
                          <>
                            {onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="rdt-action-btn rdt-btn-secondary"
                                aria-label={`Edit ${item.title}`}
                              >
                                <span>Edit</span>
                              </button>
                            )}
                            {onItemClick && (
                              <button
                                type="button"
                                onClick={() => onItemClick(item)}
                                className="rdt-action-btn rdt-btn-primary"
                                aria-label={`View details for ${item.title}`}
                              >
                                <span>View</span>
                                <ChevronRight size={15} />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(item)}
                                className="rdt-action-btn rdt-btn-danger"
                                aria-label={`Delete ${item.title}`}
                              >
                                <span>Remove</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Summary Footer */}
      <footer className="rdt-footer-bar">
        <span>
          Showing <strong>{processedItems.length}</strong> of <strong>{items.length}</strong> entries
        </span>
        <div className="rdt-breakpoint-indicator" aria-hidden="true">
          <span className="indicator-dot" />
          <span className="desktop-text">Desktop Multi-Column Mode (≥ 1024px)</span>
          <span className="tablet-text">Tablet 2-Column Grid Mode (768px - 1023px)</span>
          <span className="mobile-text">Mobile Vertical Card Mode (&lt; 768px)</span>
        </div>
      </footer>
    </section>
  );
}
