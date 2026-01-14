"use client";

import { useState } from 'react';
import AddMemberModal from './add-member-modal';
import { CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { addMember } from '@/actions/user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AddMemberProps {
    workspaceId: string,
    userRole: "owner" | "admin" | "member" | null
}

export default function AddMemberSection({ workspaceId, userRole }: AddMemberProps) {
    const [isOpen, setIsOpen] = useState(false);

    const router = useRouter()

    const handleAddMember = async (email: string, role: string) => {
        const response = await addMember(workspaceId, role, email);
        if (response.success) {
            toast.success(response.message);
            router.refresh();

        } else {
            toast.error(response.message)
        }
    };

    return (
        <>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Workspace Members</CardTitle>
                    {userRole === "owner" || userRole === "admin" &&
                        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                            Add Member
                        </Button>
                    }
                </div>
            </CardHeader>

            <AddMemberModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onAddMember={handleAddMember}
            />
        </>
    );
}