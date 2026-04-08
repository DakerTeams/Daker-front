import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  applyToTeam,
  deleteTeam,
  fetchMyTeams,
  fetchTeamDetail,
  fetchTeams,
  updateTeam,
} from "../api/teams.js";
import { getStoredUser } from "../lib/auth.js";
import Pagination from "../components/common/Pagination.jsx";

const PAGE_SIZE = 6

function createEmptyPosition() {
  return {
    positionName: "",
    requiredCount: "1",
  };
}

const openFilters = [
  { key: "all", label: "전체" },
  { key: "open", label: "모집중" },
  { key: "closed", label: "마감" },
];

function CampPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredHackathonId = searchParams.get("hackathonId") ?? "";
  const hackathonSlug = searchParams.get("hackathon") ?? "";
  const [query, setQuery] = useState("");
  const [openFilter, setOpenFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [myTeams, setMyTeams] = useState([]);
  const [appliedTeamIds, setAppliedTeamIds] = useState([]);
  const [teamDetailMessage, setTeamDetailMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    isOpen: "true",
    maxMembers: "5",
    positions: [createEmptyPosition()],
  });
  const [editMessage, setEditMessage] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTeamsAndHackathons() {
      setIsLoading(true);

      try {
        const [teamData, myTeamData] = await Promise.all([
          fetchTeams({
            isOpen: openFilter === "all" ? undefined : openFilter === "open",
            q: query.trim() || undefined,
            hackathon: hackathonSlug || undefined,
            page,
            size: PAGE_SIZE,
          }),
          getStoredUser()
            ? fetchMyTeams().catch(() => [])
            : Promise.resolve([]),
        ]);
        if (!isMounted) return;

        setItems(teamData.items);
        setTotalPages(teamData.totalPages);
        setMyTeams(myTeamData);
      } catch {
        if (!isMounted) return;
        setItems([]);
        setTotalPages(0);
        setMyTeams([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTeamsAndHackathons();

    return () => {
      isMounted = false;
    };
  }, [openFilter, query, page, hackathonSlug]);

  const handleOpenTeam = async (teamId) => {
    setSelectedPosition("");

    if (!getStoredUser()) {
      setTeamDetailMessage("로그인 후 합류 신청이 가능합니다.");
    } else {
      setTeamDetailMessage("");
    }

    try {
      const detail = await fetchTeamDetail(teamId);
      setSelectedTeam(detail);
    } catch {
      const fallbackTeam = items.find((item) => item.id === teamId) ?? null;
      setSelectedTeam({
        ...fallbackTeam,
        members: [],
      });
      setTeamDetailMessage(
        "팀 상세 정보를 불러오지 못해 기본 정보만 표시합니다.",
      );
    }
  };

  const handleApply = async () => {
    if (!selectedTeam) return;

    if (!getStoredUser()) {
      navigate("/login");
      return;
    }

    setIsApplying(true);
    setTeamDetailMessage("");

    try {
      await applyToTeam(selectedTeam.id, selectedPosition || null);
      setAppliedTeamIds((current) =>
        current.includes(selectedTeam.id)
          ? current
          : [...current, selectedTeam.id],
      );
      setTeamDetailMessage("합류 신청이 완료되었습니다.");
    } catch {
      setTeamDetailMessage(
        "합류 신청에 실패했습니다. 이미 신청했거나 팀 정원이 찼을 수 있습니다.",
      );
    } finally {
      setIsApplying(false);
    }
  };

  const currentUser = getStoredUser();
  const isMySelectedTeam = selectedTeam
    ? myTeams.some((team) => String(team.id) === String(selectedTeam.id))
    : false;
  const selectedLeaderName = selectedTeam?.leader ?? "";
  const isSelectedTeamLeader =
    isMySelectedTeam &&
    Boolean(currentUser) &&
    ((selectedTeam?.leaderId && selectedTeam.leaderId === currentUser.userId) ||
      (currentUser?.nickname && selectedLeaderName === currentUser.nickname));
  const hasAppliedToSelectedTeam = selectedTeam
    ? appliedTeamIds.includes(selectedTeam.id)
    : false;

  const filteredTeams = items;

  function handleFilterChange(key) {
    setOpenFilter(key);
    setPage(0);
  }

  function handleQueryChange(event) {
    setQuery(event.target.value);
    setPage(0);
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/camp</p>
        <h1>팀원 모집</h1>
      </div>

      <section className="surface-card">
        <div className="row-between row-between--wrap">
          <div className="stack-list stack-list--compact">
            {hackathonSlug ? (
              <>
                <h2>해커톤 팀 목록</h2>
                <p className="page-description">
                  <span className="camp-hackathon-filter-badge">{hackathonSlug}</span> 해커톤의 팀만 표시 중입니다.&nbsp;
                  <button type="button" className="button-link" onClick={() => navigate("/camp")}>전체 보기</button>
                </p>
              </>
            ) : (
              <>
                <h2>함께 해커톤을 완주할 팀원을 찾아보세요.</h2>
                <p className="page-description">
                  모집 상태와 해커톤별로 필터링해서 원하는 팀을 빠르게 찾을 수 있습니다.
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            className="button-link"
            onClick={() =>
              navigate(
                preferredHackathonId
                  ? `/team-create?hackathonId=${preferredHackathonId}`
                  : "/team-create",
              )
            }
          >
            + 팀 생성하기
          </button>
        </div>
      </section>

      <section className="surface-card">
        <div className="toolbar camp-toolbar">
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            className="search-input camp-search-input"
            placeholder="팀명, 포지션, 해커톤명으로 검색"
          />

          <div
            className="filter-group camp-status-filter"
            aria-label="모집 상태 필터"
          >
            {openFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip${
                  openFilter === filter.key ? " filter-chip--active" : ""
                }`}
                onClick={() => handleFilterChange(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="surface-card empty-panel">
          <p className="empty-panel__title">팀 모집글을 불러오는 중입니다.</p>
        </section>
      ) : null}

      {!isLoading && filteredTeams.length === 0 ? (
        <section className="surface-card empty-panel">
          <p className="empty-panel__title">
            조건에 맞는 팀 모집글이 없습니다.
          </p>
          <p className="page-description">
            필터를 조정하거나 새 팀을 직접 만들어보세요.
          </p>
        </section>
      ) : (
        <div className="camp-grid">
          {filteredTeams.map((team) => (
            <article
              key={team.id}
              className="team-card"
              role="button"
              tabIndex={0}
              onClick={() => handleOpenTeam(team.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenTeam(team.id);
                }
              }}
            >
              <div className="team-card-head">
                <div>
                  <h2>{team.name}</h2>
                  <p className="team-card__hackathon">
                    <Trophy size={13} strokeWidth={2} style={{verticalAlign:'middle', marginRight:4}} />{team.hackathonName}
                  </p>
                </div>
                <span
                  className={`status-outline ${
                    team.isOpen
                      ? "status-outline--open"
                      : "status-outline--closed"
                  }`}
                >
                  {team.isOpen ? "모집 중" : "마감"}
                </span>
              </div>

              <p className="team-desc">{team.description}</p>

              <div className="team-positions">
                {team.positionDetails.map((position) => (
                  <span
                    key={`${team.id}-${position.positionName}`}
                    className="tag-chip"
                  >
                    {position.positionName} · {position.requiredCount}명
                  </span>
                ))}
              </div>

              <div className="team-footer">
                <span>팀장: {team.leader}</span>
                <span
                  className={`camp-contact-button ${
                    team.isOpen
                      ? "camp-contact-button--open"
                      : "camp-contact-button--closed"
                  }`}
                >
                  {team.isOpen ? "팀 보기" : "마감"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && filteredTeams.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {selectedTeam && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setSelectedTeam(null)}
        >
          <aside
            className="team-create-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-detail-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="team-create-drawer__header">
              <div>
                <p className="eyebrow">team detail</p>
                <h2 id="team-detail-drawer-title">{selectedTeam.name}</h2>
              </div>
              <button
                type="button"
                className="drawer-close-button"
                onClick={() => setSelectedTeam(null)}
              >
                닫기
              </button>
            </div>

            <div className="team-create-drawer__body">
              <section className="surface-card">
                <div className="stack-list stack-list--compact">
                  <p className="meta-text"><Trophy size={13} strokeWidth={2} style={{verticalAlign:'middle', marginRight:4}} />{selectedTeam.hackathonName}</p>
                  <p>
                    {selectedTeam.description || "팀 소개가 아직 없습니다."}
                  </p>
                </div>
              </section>

              <section className="surface-card">
                <div className="stack-list stack-list--compact">
                  <div className="info-row">
                    <span>팀장</span>
                    <span>{selectedTeam.leader}</span>
                  </div>
                  <div className="info-row">
                    <span>모집 상태</span>
                    <span>{selectedTeam.isOpen ? "모집 중" : "마감"}</span>
                  </div>
                  <div className="info-row">
                    <span>현재 인원</span>
                    <span>
                      {selectedTeam.currentMembers}/{selectedTeam.maxMembers}
                    </span>
                  </div>
                </div>
              </section>

              <section className="surface-card">
                <p className="meta-text">모집 포지션</p>
                <div className="team-positions">
                  {selectedTeam.positionDetails?.length > 0 ? (
                    selectedTeam.positionDetails.map((position) => (
                      <span
                        key={`${selectedTeam.id}-${position.positionName}`}
                        className="tag-chip"
                      >
                        {position.positionName} · {position.requiredCount}명
                      </span>
                    ))
                  ) : (
                    <span className="meta-text">
                      현재 별도 포지션 정보가 없습니다.
                    </span>
                  )}
                </div>
              </section>

              {selectedTeam.isOpen && !isSelectedTeamLeader ? (
                <section className="surface-card">
                  <label className="form-field">
                    <span className="form-label">지원할 역할</span>
                    <select
                      className="form-control"
                      value={selectedPosition}
                      onChange={(event) =>
                        setSelectedPosition(event.target.value)
                      }
                    >
                      <option value="">역할 선택 안 함</option>
                      {(selectedTeam.positionDetails ?? []).map((position) => (
                        <option
                          key={`${selectedTeam.id}-apply-${position.positionName}`}
                          value={position.positionName}
                        >
                          {position.positionName} ({position.requiredCount}명)
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              ) : null}

              <section className="surface-card">
                <p className="meta-text">팀원</p>
                <div className="stack-list stack-list--compact">
                  {selectedTeam.members?.length > 0 ? (
                    selectedTeam.members.map((member) => (
                      <div key={member.userId} className="info-row">
                        <span>{member.nickname}</span>
                        {member.position && (
                          <span className="tag-chip">{member.position}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="meta-text">팀원 상세 정보는 아직 없습니다.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="team-create-drawer__footer">
              {teamDetailMessage ? (
                <p className="meta-text">{teamDetailMessage}</p>
              ) : null}
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setSelectedTeam(null)}
              >
                닫기
              </button>
              {isSelectedTeamLeader ? (
                <>
                  <button
                    type="button"
                    className="team-secondary-button team-secondary-button--muted"
                    onClick={() => {
                      setEditForm({
                        name: selectedTeam.name ?? "",
                        description: selectedTeam.description ?? "",
                        isOpen: String(selectedTeam.isOpen ?? true),
                        maxMembers: String(selectedTeam.maxMembers ?? 5),
                        positions:
                          selectedTeam.positionDetails?.length > 0
                            ? selectedTeam.positionDetails.map((position) => ({
                                positionName: position.positionName,
                                requiredCount: String(
                                  position.requiredCount ?? 1,
                                ),
                              }))
                            : [createEmptyPosition()],
                      });
                      setEditMessage("");
                      setIsEditDrawerOpen(true);
                    }}
                  >
                    팀 수정
                  </button>
                  <button
                    type="button"
                    className="team-danger-button"
                    onClick={async () => {
                      try {
                        setIsDeleting(true);
                        await deleteTeam(selectedTeam.id);
                        setItems((current) =>
                          current.filter(
                            (team) =>
                              String(team.id) !== String(selectedTeam.id),
                          ),
                        );
                        setMyTeams((current) =>
                          current.filter(
                            (team) =>
                              String(team.id) !== String(selectedTeam.id),
                          ),
                        );
                        setSelectedTeam(null);
                      } catch {
                        setTeamDetailMessage("팀 삭제에 실패했습니다.");
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                  >
                    {isDeleting ? "삭제 중..." : "팀 삭제"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="team-primary-button"
                  onClick={handleApply}
                  disabled={
                    !selectedTeam.isOpen ||
                    isApplying ||
                    hasAppliedToSelectedTeam
                  }
                >
                  {hasAppliedToSelectedTeam
                    ? "신청 완료"
                    : selectedTeam.isOpen
                      ? isApplying
                        ? "신청 중..."
                        : "합류 신청"
                      : "모집 마감"}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {isEditDrawerOpen && selectedTeam ? (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setIsEditDrawerOpen(false)}
        >
          <aside
            className="team-create-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-edit-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="team-create-drawer__header">
              <div>
                <p className="eyebrow">edit team</p>
                <h2 id="team-edit-drawer-title">팀 정보 수정</h2>
              </div>
              <button
                type="button"
                className="drawer-close-button"
                onClick={() => setIsEditDrawerOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="team-create-drawer__body">
              <section className="surface-card">
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-label">팀명</span>
                    <input
                      className="form-control"
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field form-field--full">
                    <span className="form-label">팀 소개</span>
                    <textarea
                      className="form-control form-control--textarea"
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">모집 상태</span>
                    <select
                      className="form-control"
                      value={editForm.isOpen}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          isOpen: event.target.value,
                        }))
                      }
                    >
                      <option value="true">모집 중</option>
                      <option value="false">마감</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">최대 팀원 수</span>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      value={editForm.maxMembers}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          maxMembers: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="stack-list stack-list--compact">
                  <div className="info-row">
                    <span className="form-label">모집 역할</span>
                    <button
                      type="button"
                      className="button-link button-link--ghost"
                      onClick={() =>
                        setEditForm((current) => ({
                          ...current,
                          positions: [
                            ...current.positions,
                            createEmptyPosition(),
                          ],
                        }))
                      }
                    >
                      역할 추가
                    </button>
                  </div>

                  {editForm.positions.map((position, index) => (
                    <div
                      key={`camp-edit-position-${index}`}
                      className="form-grid"
                    >
                      <label className="form-field">
                        <span className="form-label">역할명</span>
                        <input
                          className="form-control"
                          value={position.positionName}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              positions: current.positions.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        positionName: event.target.value,
                                      }
                                    : item,
                              ),
                            }))
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span className="form-label">인원</span>
                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          value={position.requiredCount}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              positions: current.positions.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        requiredCount: event.target.value,
                                      }
                                    : item,
                              ),
                            }))
                          }
                        />
                      </label>

                      <div className="form-field">
                        <span className="form-label">관리</span>
                        <button
                          type="button"
                          className="button-link button-link--ghost"
                          onClick={() =>
                            setEditForm((current) => ({
                              ...current,
                              positions:
                                current.positions.length === 1
                                  ? [createEmptyPosition()]
                                  : current.positions.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                            }))
                          }
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="team-create-drawer__footer">
              {editMessage ? <p className="meta-text">{editMessage}</p> : null}
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsEditDrawerOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="team-primary-button"
                onClick={async () => {
                  try {
                    setIsSavingEdit(true);
                    setEditMessage("");
                    const updated = await updateTeam(selectedTeam.id, {
                      name: editForm.name,
                      description: editForm.description,
                      isOpen: editForm.isOpen === "true",
                      maxMemberCount: Number(editForm.maxMembers) || 1,
                      positions: editForm.positions
                        .map((position) => ({
                          positionName: position.positionName.trim(),
                          requiredCount: Number(position.requiredCount) || 1,
                        }))
                        .filter((position) => position.positionName),
                    });

                    const nextSelectedTeam = {
                      ...selectedTeam,
                      ...updated,
                      description: editForm.description,
                      isOpen: editForm.isOpen === "true",
                      maxMembers:
                        Number(editForm.maxMembers) || selectedTeam.maxMembers,
                      positionDetails: editForm.positions
                        .map((position) => ({
                          positionName: position.positionName.trim(),
                          requiredCount: Number(position.requiredCount) || 1,
                        }))
                        .filter((position) => position.positionName),
                      positions: editForm.positions
                        .map((position) => position.positionName.trim())
                        .filter(Boolean),
                    };

                    setSelectedTeam(nextSelectedTeam);
                    setItems((current) =>
                      current.map((team) =>
                        String(team.id) === String(selectedTeam.id)
                          ? nextSelectedTeam
                          : team,
                      ),
                    );
                    setMyTeams((current) =>
                      current.map((team) =>
                        String(team.id) === String(selectedTeam.id)
                          ? nextSelectedTeam
                          : team,
                      ),
                    );
                    setIsEditDrawerOpen(false);
                  } catch {
                    setEditMessage("팀 수정에 실패했습니다.");
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}
              >
                {isSavingEdit ? "저장 중..." : "저장"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

export default CampPage;
